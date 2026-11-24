import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildComparison,
  mergeRegion,
  connectorType,
} from "../dist/multidiff.js";
import { diffArrays } from "../dist/diff.js";
import { demoFiles } from "../dist/demo.js";
const files = (...texts) =>
  texts.map((text, i) => ({ id: String(i), text, name: `${i}.txt` }));
function reconstruct(c) {
  for (const f of c.ordered) {
    const lines = f.text === "" ? [] : f.text.split("\n");
    assert.deepEqual(
      c.groups.flatMap((g) => g.segments.get(f.id).lines),
      lines,
      `preserve source ${f.id}`,
    );
    assert.deepEqual(
      c.groups.flatMap((g) => g.segments.get(f.id).rows).map((r) => r.text),
      lines,
      `preserve rows ${f.id}`,
    );
    let cursor = 0;
    for (const g of c.groups) {
      const s = g.segments.get(f.id);
      assert.equal(s.start, cursor, `contiguous segment start ${f.id}`);
      cursor = s.end;
      assert.deepEqual(lines.slice(s.start, s.end), s.lines);
    }
  }
}
test("Diff arrays distinguish an empty file from one empty line", () => {
  assert.equal(diffArrays([], [""]).changes.length, 1);
  assert.equal(diffArrays([""], []).changes.length, 1);
});
test("Two, three and four files are all represented and compared concurrently", () => {
  for (let n = 2; n <= 4; n++) {
    const f = demoFiles.slice(0, n).map((f, i) => ({ ...f, id: String(i) }));
    const c = buildComparison(f, "0");
    assert.equal(c.ordered.length, n);
    assert.equal(c.pairs.size, n - 1);
    reconstruct(c);
    for (const target of f.slice(1))
      assert.ok(
        c.changes.some((g) => g.segments.get(target.id).type !== "equal"),
      );
  }
});
test("Selecting any baseline retains all four sources in shelf order", () => {
  const f = files(
    "one\ntwo\nthree",
    "one\nTWO\nthree",
    "zero\none\ntwo\nthree",
    "one\nthree",
  );
  for (const base of f) {
    const c = buildComparison(f, base.id);
    assert.equal(c.baseline.id, base.id);
    assert.deepEqual(c.ordered, f);
    assert.deepEqual([...c.pairs.keys()], f.filter((file) => file !== base).map((file) => file.id));
    reconstruct(c);
  }
});
test("Insertions at start, end, and empty baseline map without consuming neighbors", () => {
  for (const f of [
    files("a\nb", "x\na\nb", "a\nb\ny", "a\nx\nb"),
    files("", "x", "y\nz", ""),
    files("\n", "\nx\n", "\n\n", ""),
  ])
    reconstruct(buildComparison(f, "0"));
});
test("Overlapping changes across targets form shared global regions", () => {
  const c = buildComparison(
    files("a\nb\nc\nd\ne", "a\nB\nC\nd\ne", "a\nb\nC\nD\ne", "a\nb\nc\nd\ne"),
    "0",
  );
  reconstruct(c);
  assert.equal(c.changes.length, 1);
  assert.equal(c.changes[0].segments.get("3").type, "equal");
});
test("Merges splice the intended file and preserve all other sources", () => {
  const f = files("a\nb\nc", "a\nB\nc", "a\nb\nc\nd", "zero\na\nb\nc");
  const c = buildComparison(f, "0");
  for (const g of c.changes)
    for (const target of f.slice(1)) {
      const s = g.segments.get(target.id);
      if (s.type === "equal") continue;
      const index = c.groups.indexOf(g),
        toTarget = mergeRegion(c, index, target.id),
        toBase = mergeRegion(c, index, target.id, true);
      assert.equal(toTarget.id, target.id);
      assert.equal(toBase.id, "0");
      assert.equal(f[0].text, "a\nb\nc");
      const outputLines = toTarget.text === "" ? [] : toTarget.text.split("\n");
      assert.deepEqual(
        outputLines.slice(s.start, s.start + g.segments.get("0").lines.length),
        g.segments.get("0").lines,
      );
    }
});
test("Unified rows include baseline deletions and target additions from every target", () => {
  const c = buildComparison(files("a\nb", "a\nB", "a\nb\nc", "b"), "2");
  for (const f of c.ordered.filter((file) => file.id !== c.baseline.id)) {
    const unified = c.groups.flatMap((g) => g.segments.get(f.id).unified);
    assert.deepEqual(
      unified.filter((r) => r.type !== "deleted").map((r) => r.text),
      f.text.split("\n"),
    );
    assert.deepEqual(
      unified
        .filter((r) => r.type === "deleted" || r.type === "equal")
        .map((r) => r.text),
      c.baseline.text.split("\n"),
    );
  }
});
test("Ignoring whitespace removes comparison differences consistently", () => {
  const c = buildComparison(files("a b", "ab", " a  b ", "a\tb"), "0", true);
  assert.equal(c.changes.length, 0);
  reconstruct(c);
});
test("Empty files produce a valid empty comparison", () => {
  const c = buildComparison(files("", "", "", ""), "0");
  assert.equal(c.changes.length, 0);
  assert.equal(c.groups.length, 0);
});
test("Connector colors describe actual neighboring content", () => {
  assert.equal(connectorType({ lines: ["a"] }, { lines: ["a"] }), "equal");
  assert.equal(connectorType({ lines: [] }, { lines: ["a"] }), "added");
  assert.equal(connectorType({ lines: ["a"] }, { lines: [] }), "deleted");
});
test("Randomized four-source alignments retain all lines and boundaries", () => {
  let seed = 82;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 150; i++) {
    const f = files(
      ...Array.from({ length: 4 }, () =>
        Array.from({ length: Math.floor(random() * 15) }, () =>
          String(Math.floor(random() * 6)),
        ).join("\n"),
      ),
    );
    for (const base of f) reconstruct(buildComparison(f, base.id));
  }
});
