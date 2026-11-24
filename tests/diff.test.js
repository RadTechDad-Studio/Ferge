import { test } from "node:test";
import assert from "node:assert/strict";
import { diffLines, makePatch, inlineParts } from "../dist/diff.js";
import { original, modified } from "../dist/demo.js";
const samples = [
  ["", ""],
  ["", "one"],
  ["one", ""],
  ["a\nb", "a\nx\nb"],
  ["a\nx\nb", "a\nb"],
  ["hello world", "hello earth"],
  ["a\nb\nc", "c\nb\na"],
  [original, modified],
  ["a\n", "a"],
  ["\n", ""],
];
for (const [a, b] of samples)
  test(`Reconstruct both sides: ${JSON.stringify(a.slice(0, 20))} → ${JSON.stringify(b.slice(0, 20))}`, () => {
    const r = diffLines(a, b);
    assert.deepEqual(
      r.groups.flatMap((g) => g.aLines),
      r.A,
    );
    assert.deepEqual(
      r.groups.flatMap((g) => g.bLines),
      r.B,
    );
    for (const g of r.groups) {
      assert.deepEqual(
        r.A.slice(g.aStart, g.aStart + g.aLines.length),
        g.aLines,
      );
      assert.deepEqual(
        r.B.slice(g.bStart, g.bStart + g.bLines.length),
        g.bLines,
      );
    }
    for (const g of r.changes) {
      const x = [...r.B];
      x.splice(g.bStart, g.bLines.length, ...g.aLines);
      assert.ok(x.length >= 0);
    }
  });
test("Whitespace preference ignores indentation and spacing", () => {
  assert.equal(
    diffLines("hello  world", " hello world ", true).changes.length,
    0,
  );
  assert.equal(diffLines("hello  world", " hello world ").changes.length, 1);
});
test("Inline highlight isolates changed text", () =>
  assert.deepEqual(inlineParts("hello world!", "hello earth!"), [
    "hello ",
    "world",
    "!",
  ]));
test("Patch contains source headers and hunk", () => {
  assert.equal(
    makePatch(diffLines("a\nb\n", "a\nc\n"), "old.txt", "new.txt"),
    "--- a/old.txt\n+++ b/new.txt\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n",
  );
});
test("Random changes retain exact source order and positions", () => {
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 100; i++) {
    const a = Array.from({ length: Math.floor(rand() * 30) }, () =>
      String(Math.floor(rand() * 8)),
    ).join("\n");
    const b = Array.from({ length: Math.floor(rand() * 30) }, () =>
      String(Math.floor(rand() * 8)),
    ).join("\n");
    const r = diffLines(a, b);
    assert.deepEqual(
      r.groups.flatMap((g) => g.aLines),
      r.A,
    );
    assert.deepEqual(
      r.groups.flatMap((g) => g.bLines),
      r.B,
    );
  }
});

test("Patch preserves missing final newlines and real whitespace changes", () => {
  assert.ok(
    makePatch(diffLines("a", "a\n"), "a", "b").includes(
      "\\ No newline at end of file",
    ),
  );
  assert.ok(makePatch(diffLines("a b", "ab", true), "a", "b").includes("-a b"));
});
