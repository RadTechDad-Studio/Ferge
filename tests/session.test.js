import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initSession,
  activeFile,
  chooseFile,
  removeFile,
  clearFiles,
  addFiles,
  snapshotSession,
  validateTextFiles,
} from "../dist/session.js";
const defaults = { a: "old", b: "new" };
test("Original saved comparisons migrate without losing contents", () => {
  const s = initSession(
    { a: "custom A", b: "custom B", nameA: "a.py", nameB: "b.py" },
    defaults,
  );
  assert.equal(activeFile(s, "A").text, "custom A");
  assert.equal(activeFile(s, "B").name, "b.py");
});
test("All six pairs of four files can be selected without duplicating a source", () => {
  const s = initSession(null, defaults);
  addFiles(s, [
    { name: "c", text: "third" },
    { name: "d", text: "fourth" },
  ]);
  for (const a of s.files)
    for (const b of s.files) {
      if (a === b) continue;
      chooseFile(s, a.id, "A");
      chooseFile(s, b.id, "B");
      assert.equal(activeFile(s, "A").id, a.id);
      assert.equal(activeFile(s, "B").id, b.id);
    }
});
test("Selecting the opposite source swaps active files", () => {
  const s = initSession(null, defaults),
    before = s.activeA;
  chooseFile(s, s.activeB, "A");
  assert.equal(s.activeB, before);
  assert.notEqual(s.activeA, s.activeB);
});
test("Four-file limit rejects whole batch without truncating or changing files", () => {
  const s = initSession(null, defaults);
  const before = JSON.stringify(s);
  assert.throws(
    () => addFiles(s, [{ name: "c" }, { name: "d" }, { name: "e" }]),
    /up to 4/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("Closing the last two files leaves empty panes with distinct roles", () => {
  const s = initSession(null, defaults);
  addFiles(s, [
    { name: "c", text: "third" },
    { name: "d", text: "fourth" },
  ]);
  assert.equal(removeFile(s, s.activeA), true);
  assert.ok(activeFile(s, "A"));
  assert.notEqual(s.activeA, s.activeB);
  assert.equal(removeFile(s, s.activeB), true);
  assert.ok(activeFile(s, "B"));
  assert.equal(removeFile(s, s.activeA), true);
  assert.equal(activeFile(s, "A").placeholder, true);
  assert.equal(removeFile(s, s.activeB), true);
  assert.ok(s.files.every((f) => f.placeholder && f.text === ""));
  assert.notEqual(s.baselineId, s.targetId);
  assert.equal(removeFile(s, s.activeA), false);
  assert.equal(s.files.length, 2);
});
test("Clearing a session persists empty panes without resurrecting the example", () => {
  const s = { ...initSession(null, defaults), theme: "dark", wrap: true };
  const previous = snapshotSession(s);
  clearFiles(s);
  assert.equal(s.files.length, 2);
  assert.ok(s.files.every((f) => f.placeholder && f.text === ""));
  assert.equal(s.theme, "dark");
  assert.equal(s.wrap, true);
  const restored = initSession(JSON.parse(JSON.stringify(s)), defaults);
  assert.deepEqual(restored.files, s.files);
  assert.notEqual(restored.baselineId, restored.targetId);
  Object.assign(s, previous);
  assert.equal(activeFile(s, "A").text, "old");
  assert.equal(activeFile(s, "B").text, "new");
});
test("Imports fill empty panes before adding panes and retain the four-file cap", () => {
  const s = initSession(null, defaults);
  clearFiles(s);
  const baseline = s.baselineId;
  addFiles(s, [{ name: "empty.txt", text: "" }]);
  assert.equal(s.files.length, 2);
  assert.equal(s.baselineId, baseline);
  assert.equal(activeFile(s, "A").placeholder, undefined);
  assert.equal(activeFile(s, "A").name, "empty.txt");
  addFiles(s, [
    { name: "b", text: "second" },
    { name: "c", text: "third" },
    { name: "d", text: "fourth" },
  ]);
  assert.equal(s.files.length, 4);
  assert.ok(s.files.every((f) => !f.placeholder));
  const before = JSON.stringify(s);
  assert.throws(() => addFiles(s, [{ name: "fifth" }]), /up to 4/);
  assert.equal(JSON.stringify(s), before);
});
test("Undo snapshots and persistence keep edits in the right file", () => {
  const s = initSession(null, defaults);
  addFiles(s, [{ name: "c", text: "third" }]);
  const snap = snapshotSession(s);
  activeFile(s, "A").text = "merged";
  assert.equal(snap.files[0].text, "old");
  Object.assign(s, snap);
  assert.equal(activeFile(s, "A").text, "old");
  const restored = initSession(JSON.parse(JSON.stringify(s)), defaults);
  assert.deepEqual(restored, s);
});
test("Invalid persisted selections and duplicate IDs are repaired", () => {
  const s = initSession(
    {
      files: [
        { id: "x", name: "a", text: "one" },
        { id: "x", name: "b", text: "two" },
      ],
      activeA: "missing",
      activeB: "x",
    },
    defaults,
  );
  assert.notEqual(s.activeA, s.activeB);
  assert.ok(activeFile(s, "A"));
  assert.ok(activeFile(s, "B"));
});
test("Binary, image, oversized, and excess files are rejected", () => {
  for (const f of [
    { name: "photo.png", size: 1 },
    { name: "notes.txt", type: "image/jpeg", size: 1 },
    { name: "huge.py", size: 1000001 },
  ])
    assert.throws(() => validateTextFiles([f]));
  assert.throws(() =>
    validateTextFiles(new Array(5).fill({ name: "code.py", size: 10 })),
  );
  assert.doesNotThrow(() => validateTextFiles([{ name: "code.py", size: 10 }]));
});
