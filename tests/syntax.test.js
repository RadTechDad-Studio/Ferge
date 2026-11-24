import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectLanguage,
  highlightDocument,
  renderSyntaxLine,
  splitHighlighted,
} from "../dist/syntax.js";
test("Language detection uses filename, shebang, JSON content and code content", () => {
  assert.equal(detectLanguage("", "index.tsx").language, "typescript");
  assert.equal(detectLanguage("", "main.py").language, "python");
  assert.equal(detectLanguage("", "Makefile").language, "makefile");
  assert.equal(
    detectLanguage("#!/usr/bin/env python3\nprint(1)", "Clipboard Item")
      .language,
    "python",
  );
  assert.equal(
    detectLanguage('{"items":[1,2]}', "Clipboard Item").language,
    "json",
  );
  assert.equal(
    detectLanguage(
      'def greet(name):\n    return "Hello " + name\n\nprint(greet("World"))',
      "Clipboard Item",
    ).language,
    "python",
  );
  assert.equal(
    detectLanguage("A quiet ordinary sentence.", "notes.txt").language,
    "plaintext",
  );
});
test("Manual selection overrides file extension including plain text", () => {
  assert.equal(
    detectLanguage("def main():", "file.py", "javascript").language,
    "javascript",
  );
  assert.equal(
    detectLanguage("def main():", "file.py", "plaintext").language,
    "plaintext",
  );
});
test("Full-document lexing preserves multiline strings and comments", () => {
  const r = highlightDocument(
    '"""first\nsecond\nthird"""\ndef main():\n    return 42',
    "a.py",
  );
  assert.equal(r.lines.length, 5);
  assert.equal(r.lines[1].map((t) => t.text).join(""), "second");
  assert.ok(r.lines[1].some((t) => t.classes.includes("hljs-string")));
  assert.ok(r.lines[3].some((t) => t.classes.includes("hljs-keyword")));
});
test("Highlighted tokens reconstruct original contents and retain offsets", () => {
  const text = 'const x = "<script>&\\\"";\n// next\n';
  const r = highlightDocument(text, "main.js");
  assert.equal(
    r.lines.map((l) => l.map((t) => t.text).join("")).join("\n"),
    text,
  );
  for (const line of r.lines)
    for (const t of line) assert.equal(t.end - t.start, t.text.length);
});
test("Syntax, inline diff and invisible markers coexist without unsafe HTML", () => {
  const r = highlightDocument('return "<script>"', "file.py");
  const html = renderSyntaxLine('return "<script>"', r.lines[0], [8, 16], true);
  assert.ok(html.includes("hljs-keyword"));
  assert.ok(html.includes("<mark>"));
  assert.ok(html.includes("invisible"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});
test("Syntax can be disabled without removing text", () => {
  const r = highlightDocument(
    "def foo():\n    return 1",
    "a.py",
    "auto",
    false,
  );
  assert.ok(r.lines.flat().every((t) => !t.classes));
  assert.equal(r.language, "python");
});
test("Large automatic inputs remain safe and manual selection can still highlight", () => {
  const text = "print(1)\n".repeat(23000);
  const r = highlightDocument(text, "a.py");
  assert.equal(r.source, "large file");
  assert.ok(r.lines.flat().every((t) => !t.classes));
});
test("Empty source and nested scopes preserve text", () => {
  assert.deepEqual(splitHighlighted(""), [[]]);
  assert.equal(
    splitHighlighted(
      '<span class="hljs-string">a\n<span class="hljs-subst">b</span></span>',
    )[1][0].classes,
    "hljs-string hljs-subst",
  );
});
