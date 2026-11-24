import { JSDOM } from "jsdom";
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
const dom = new JSDOM(html, { url: "https://example.test/ferge/" });
const w = dom.window;
globalThis.window = w;
for (const key of [
  "document",
  "localStorage",
  "NodeFilter",
  "HTMLElement",
  "HTMLDialogElement",
])
  globalThis[key] = w[key];
globalThis.getComputedStyle = w.getComputedStyle.bind(w);
const systemAppearance = new w.EventTarget();
systemAppearance.matches = false;
globalThis.matchMedia = () => systemAppearance;
globalThis.ResizeObserver = class {
  observe() {}
};
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = clearTimeout;
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
await import("../dist/app.js");
const $ = (s) => w.document.querySelector(s),
  $$ = (s) => [...w.document.querySelectorAll(s)];
const settle = () => new Promise((r) => setTimeout(r, 20));
async function checkDownload(expected) {
  const before = localStorage.getItem("ferge-workbench"),
    originalCreate = URL.createObjectURL,
    originalClick = w.HTMLAnchorElement.prototype.click;
  let payload, downloaded;
  URL.createObjectURL = (blob) => {
    payload = blob;
    return originalCreate(blob);
  };
  w.HTMLAnchorElement.prototype.click = function () {
    downloaded = { name: this.download, href: this.href };
  };
  try {
    if ($("#downloadMenu").hidden) $("#downloadButton").click();
    const choice = $$("#downloadOptions button").find(
      (button) => button.dataset.download === expected.id,
    );
    assert.ok(choice, "Every loaded file must be downloadable");
    choice.click();
    assert.equal(downloaded.name, expected.name);
    assert.ok(downloaded.href.startsWith("blob:"));
    assert.equal(payload.type, "text/plain;charset=utf-8");
    assert.deepEqual(
      new Uint8Array(await payload.arrayBuffer()),
      new TextEncoder().encode(expected.text),
      "Download must preserve the current UTF-8 contents byte for byte",
    );
    assert.equal($("#downloadMenu").hidden, true);
    assert.equal($("#downloadButton").getAttribute("aria-expanded"), "false");
    assert.equal(localStorage.getItem("ferge-workbench"), before);
  } finally {
    URL.createObjectURL = originalCreate;
    w.HTMLAnchorElement.prototype.click = originalClick;
  }
}
// First-visit onboarding is navigable and dismissible, and does not alter documents.
assert.ok($(".tour-popover"));
assert.equal($(".workbench").hasAttribute("inert"), true);
assert.equal($("#tourProgress").textContent, "1 of 9");
$("#tourNext").click();
assert.equal($("#tourTitle").textContent, "Choose the reference file");
$("#tourBack").click();
assert.equal($("#tourProgress").textContent, "1 of 9");
$("#tourSkip").click();
assert.equal($(".tour-popover"), null);
assert.equal($(".workbench").hasAttribute("inert"), false);
assert.equal(localStorage.getItem("ferge-tour-v1"), "skipped");
const { createTour } = await import("../dist/tour.js");
const repeatProbe = createTour({
  getSteps: () => [
    { selector: "#fileShelf", title: "Probe", description: "Probe" },
  ],
});
repeatProbe.maybeStart();
assert.equal(repeatProbe.isOpen(), false);

assert.equal(w.document.title, "Ferge — The File Merger");
assert.equal($("#savedState").textContent, "Saved in browser");
assert.ok($("#savedState").title.includes("Files on disk are not updated automatically"));
assert.equal($$(".pane-card").length, 4);
assert.equal($$(".file-chip").length, 4);
assert.equal($("#fileCount").textContent, "4 / 4");
assert.ok($$(".hljs-keyword").length > 0);
const names = $$(".pane-name").map((e) => e.textContent);
assert.deepEqual(names, ["baseline.js", "draft.js", "revised.js", "final.js"]);
// Finishing the example tour offers a choice without automatically changing files.
const exampleSession = localStorage.getItem("ferge-workbench");
$("#startTour").click();
for (let i = 0; i < 9; i++) $("#tourNext").click();
assert.equal($("#exampleChoice").open, true);
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
$("#keepExampleButton").click();
assert.equal($("#exampleChoice").open, false);
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
$("#startTour").click();
for (let i = 0; i < 9; i++) $("#tourNext").click();
$("#clearExampleButton").click();
assert.equal($("#exampleChoice").open, false);
assert.equal($$(".pane-card").length, 2);
assert.equal($$(".drop-empty").length, 2);
assert.equal($("#fileCount").textContent, "0 / 4");
assert.equal($("#downloadButton").disabled, true);
assert.equal($("#clearAllButton").disabled, true);
$("#undoButton").click();
assert.equal($$(".pane-card").length, 4);
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
// Reorder using the drag handle, then move the baseline card with the keyboard.
const shelfCards = () => $$("#shelfFiles .file-chip");
const shelfIds = () => shelfCards().map((card) => card.dataset.file);
const [a, b, c, d] = shelfIds();
assert.equal($$(".file-chip-grip").length, 4);
shelfCards().forEach((card, index) => {
  card.getBoundingClientRect = () => ({ x: index * 130, y: 0, width: 120, height: 50 });
});
const shelf = $("#shelfFiles");
shelf.getBoundingClientRect = () => ({ left: 0, right: 510, top: 0, bottom: 50 });
let capturedPointer;
shelf.setPointerCapture = (id) => { capturedPointer = id; };
shelf.hasPointerCapture = (id) => capturedPointer === id;
shelf.releasePointerCapture = () => { capturedPointer = null; };
const dragShelf = (target, type, clientX, clientY = 20) => target.dispatchEvent(new w.PointerEvent(type, {
  bubbles: true, pointerId: 1, isPrimary: true, clientX, clientY,
}));
const lastGrip = shelfCards()[3].querySelector(".file-chip-grip");
dragShelf(lastGrip, "pointerdown", 400);
dragShelf(shelf, "pointermove", 402);
assert.equal($(".shelf-drag-preview"), null, "Clicking a handle must not lift the card");
dragShelf(shelf, "pointermove", 135);
dragShelf(shelf, "pointercancel", 135);
assert.deepEqual(shelfIds(), [a, b, c, d]);
assert.equal(capturedPointer, null);
assert.equal($$(".shelf-drag-preview, .file-chip.is-drop-destination, .file-chip.is-dragging").length, 0);
// A vertical lift also starts the preview, and Escape or capture loss cancels it.
for (const cancel of ["Escape", "lostpointercapture"]) {
  dragShelf(lastGrip, "pointerdown", 400);
  dragShelf(shelf, "pointermove", 400, 30);
  assert.ok($(".shelf-drag-preview"));
  if (cancel === "Escape") w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  else dragShelf(shelf, cancel, 400, 30);
  assert.equal(capturedPointer, null);
  assert.equal($$(".shelf-drag-preview, .file-chip.is-drop-destination, .file-chip.is-dragging").length, 0);
  assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
}
dragShelf(lastGrip, "pointerdown", 400);
dragShelf(shelf, "pointermove", 135);
assert.equal(shelfCards()[3].classList.contains("is-dragging"), true);
assert.equal(shelfCards()[1].classList.contains("is-drop-destination"), true);
const preview = $(".shelf-drag-preview");
assert.equal(preview.getAttribute("aria-hidden"), "true");
assert.equal(preview.inert, true);
assert.equal(preview.hasAttribute("data-file"), false);
assert.equal(preview.style.width, "120px");
assert.equal(preview.style.height, "50px");
assert.equal(preview.style.transform, "translate3d(125px, 0px, 0px)");
assert.equal(preview.classList.contains("is-dragging"), false);
assert.deepEqual(shelfIds(), [a, b, c, d], "Preview must leave shelf order unchanged until release");
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
dragShelf(shelf, "pointermove", 265);
assert.equal(shelfCards()[1].classList.contains("is-drop-destination"), false);
assert.equal(shelfCards()[2].classList.contains("is-drop-destination"), true);
dragShelf(shelf, "pointermove", 520);
assert.equal($(".is-drop-destination"), null, "Leaving the shelf must clear the destination");
assert.ok($(".shelf-drag-preview"));
dragShelf(shelf, "pointermove", 135);
assert.equal($("#fileShelf").classList.contains("drop-target"), false);
dragShelf(shelf, "pointerup", 135);
assert.deepEqual(shelfIds(), [a, d, b, c]);
assert.equal($$(".shelf-drag-preview, .file-chip.is-drop-destination, .file-chip.is-dragging").length, 0);
shelfCards()[0].querySelector(".file-chip-grip").dispatchEvent(
  new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
);
assert.deepEqual(shelfIds(), [d, a, b, c]);
assert.deepEqual($$(".pane-card").map((pane) => pane.dataset.file), [d, a, b, c]);
assert.equal($(".pane-card.is-baseline").dataset.file, a);
assert.equal(w.document.activeElement, shelfCards()[1].querySelector(".file-chip-grip"));
const reordered = JSON.parse(localStorage.getItem("ferge-workbench"));
assert.deepEqual(reordered.files.map((file) => file.id), [d, a, b, c]);
assert.equal(reordered.baselineId, a);
assert.equal(reordered.targetId, b);
assert.deepEqual(reordered.files, [3, 0, 1, 2].map((index) => JSON.parse(exampleSession).files[index]));
$("#undoButton").click();
assert.deepEqual(shelfIds(), [a, d, b, c]);
$("#undoButton").click();
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
// Every part of every destination card must accept every other file, including
// adjacent moves after clearing the shelf and loading the example again.
$("#clearAllButton").click();
$("#demoButton").click();
const freshExample = JSON.parse(localStorage.getItem("ferge-workbench"));
const originalIds = freshExample.files.map((file) => file.id);
for (let from = 0; from < 4; from++) {
  for (let to = 0; to < 4; to++) {
    for (const offset of [5, 60, 115]) {
      shelfCards().forEach((card, index) => {
        card.getBoundingClientRect = () => ({ x: index * 130, y: 0, width: 120, height: 50 });
      });
      const grip = shelfCards()[from].querySelector(".file-chip-grip");
      dragShelf(grip, "pointerdown", from * 130 + 10);
      dragShelf(shelf, "pointermove", to * 130 + offset);
      dragShelf(shelf, "pointerup", to * 130 + offset);
      const expected = [...originalIds];
      const [moved] = expected.splice(from, 1);
      expected.splice(to, 0, moved);
      assert.deepEqual(shelfIds(), expected, `Move ${from + 1} to ${to + 1}, offset ${offset}`);
      assert.deepEqual($$(".pane-card").map((pane) => pane.dataset.file), expected);
      const saved = JSON.parse(localStorage.getItem("ferge-workbench"));
      assert.deepEqual(saved.files, expected.map((id) => freshExample.files.find((file) => file.id === id)));
      assert.equal(saved.baselineId, freshExample.baselineId);
      assert.equal(saved.targetId, freshExample.targetId);
      if (from !== to) $("#undoButton").click();
      assert.deepEqual(shelfIds(), originalIds);
    }
  }
}
// Restore the original example IDs used by the remaining checks.
$("#undoButton").click();
$("#undoButton").click();
assert.equal(localStorage.getItem("ferge-workbench"), exampleSession);
// Choosing a merge target must update every selection cue without editing a file.
const beforeTargetSelection = $$(".code").map((el) => el.textContent);
const clickedTarget = $$(".pane-card")[3];
clickedTarget.querySelector('[data-pane-action="target"]').click();
assert.equal($$(".pane-card.is-target").length, 1);
assert.equal($$(".merge-target-label").filter((el) => !el.hidden).length, 1);
assert.equal(clickedTarget.querySelector(".merge-target-label").hidden, false);
assert.equal(
  clickedTarget
    .querySelector('[data-pane-action="target"]')
    .getAttribute("aria-pressed"),
  "true",
);
assert.equal($("#targetSelect").value, clickedTarget.dataset.file);
assert.equal(
  $$(".pane-card.is-baseline")[0].querySelector(".merge-target-label").hidden,
  true,
);
assert.deepEqual(
  $$(".code").map((el) => el.textContent),
  beforeTargetSelection,
);
const targetMenu = $("#targetSelect");
targetMenu.value = $$(".pane-card")[1].dataset.file;
targetMenu.dispatchEvent(new w.Event("change"));
assert.equal(clickedTarget.querySelector(".merge-target-label").hidden, true);
assert.equal(
  $$(".pane-card")[1].querySelector(".merge-target-label").hidden,
  false,
);
assert.equal($$(".merge-target-label").filter((el) => !el.hidden).length, 1);
for (const mode of ["blocks", "unified", "fluid"]) {
  $(`[data-mode="${mode}"]`).click();
  assert.equal($$(".pane-card").length, 4);
  assert.equal($(`[data-mode="${mode}"]`).getAttribute("aria-pressed"), "true");
  if (mode === "unified") {
    for (const pane of $$(".pane-card").slice(1)) {
      assert.ok(
        pane.querySelector(".code-line.deleted") ||
          pane.querySelector(".code-line.added"),
      );
    }
  }
}
const oldIds = $$(".pane-card").map((p) => p.dataset.file),
  baselineSelect = $("#baselineSelect");
baselineSelect.value = oldIds[2];
baselineSelect.dispatchEvent(new w.Event("change"));
assert.equal($("#layoutHint").textContent, "Every file compared with baseline C.");
assert.deepEqual($$(".pane-card").map((pane) => pane.dataset.file), oldIds);
assert.equal($(".pane-card.is-baseline").dataset.file, oldIds[2]);
assert.equal($(".merge-controls").classList.contains("baseline-on-right"), true);
for (const mode of ["blocks", "unified", "fluid"]) {
  $(`[data-mode="${mode}"]`).click();
  assert.deepEqual($$(".pane-card").map((pane) => pane.dataset.file), oldIds);
  if (mode === "unified") {
    assert.ok($$(".pane-card")[0].querySelector(".code-line.deleted, .code-line.added"));
  }
}
const originalPerFile = new Map(
  $$(".pane-card").map((p) => [
    p.dataset.file,
    p.querySelector(".code").textContent,
  ]),
);
$("#nextButton").click();
assert.equal($("#toBaseline").disabled, false);
const target = $("#targetSelect").value;
$("#fromBaseline").click();
assert.notEqual(
  $$(".pane-card")
    .find((p) => p.dataset.file === target)
    .querySelector(".code").textContent,
  originalPerFile.get(target),
);
assert.equal($$(".pane-card").length, 4);
await checkDownload(
  JSON.parse(localStorage.getItem("ferge-workbench")).files.find(
    (file) => file.id === target,
  ),
);
$("#undoButton").click();
for (const [id, text] of originalPerFile)
  assert.equal(
    $$(".pane-card")
      .find((p) => p.dataset.file === id)
      .querySelector(".code").textContent,
    text,
  );
$("#findButton").click();
$("#search").value = "return result.equal";
$("#search").dispatchEvent(new w.Event("input"));
assert.notEqual($("#searchCount").textContent, "No matches");
assert.ok($$(".search-hit").length > 1);
$("#closeFind").click();
const lang = $$(".pane-language")[1];
lang.value = "plaintext";
lang.dispatchEvent(new w.Event("change", { bubbles: true }));
assert.equal(
  $$(".pane-card")[1].querySelectorAll('[class^="hljs-"]').length,
  0,
);
assert.ok($$(".pane-card")[2].querySelectorAll('[class^="hljs-"]').length > 0);
$("#settingsButton").click();
assert.equal($("#settings").open, true);
assert.equal(w.document.activeElement, $("#generalTab"));
const textFontSelect = $("#textFont");
const fontRoot = w.document.documentElement.style;
assert.equal(textFontSelect.value, "jetbrains-mono");
assert.match(fontRoot.getPropertyValue("--text-font"), /^"JetBrains Mono"/);
assert.deepEqual([...textFontSelect.options].filter((option) => !option.hidden).map((option) => option.text), [
  "JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro",
]);
textFontSelect.value = "source-code-pro";
textFontSelect.dispatchEvent(new w.Event("change"));
assert.match(fontRoot.getPropertyValue("--text-font"), /^"Source Code Pro"/);
assert.equal(JSON.parse(localStorage.getItem("ferge-workbench")).textFont, "source-code-pro");
$("#generalTab").dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
assert.equal(w.document.activeElement, $("#appearanceTab"));
assert.equal($("#appearancePanel").hidden, false);
assert.equal($("#generalPanel").hidden, true);
const themeEditor = $("#themeEditor");
assert.equal(themeEditor.open, false);
assert.equal($("#themeDescription"), null);
$("#themeEditor summary").click();
assert.equal(themeEditor.open, true);
const colorField = (token, type = "color") => $(`[data-theme-color="${token}"] input[type="${type}"]`);
const setThemeColor = (token, value, type) => {
  const input = colorField(token, type);
  input.value = value;
  input.dispatchEvent(new w.Event("change"));
};
const { THEMES, THEME_CHOICES } = await import("../dist/themes.js");
const setTheme = (theme) => {
  $("#themeSelect").value = theme;
  $("#themeSelect").dispatchEvent(new w.Event("change"));
};
const setAppearanceMode = (mode) => {
  $(`[name="appearanceMode"][value="${mode}"]`).click();
};
const activeTheme = () => w.document.documentElement.dataset.theme;
assert.deepEqual([...$("#themeSelect").options].map((option) => option.value),
  THEME_CHOICES.map((theme) => theme.id));
assert.equal($("#appearancePanel").firstElementChild.className, "appearance-mode");
const codeBeforeAppearance = $$(".code").map((el) => el.textContent);
for (const choice of THEME_CHOICES) {
  setTheme(choice.id);
  for (const mode of ["light", "dark"]) {
    setAppearanceMode(mode);
    const theme = THEMES.find(({ id }) => id === choice[mode]);
    assert.equal(activeTheme(), theme.id);
    assert.equal(w.document.documentElement.dataset.colorScheme, mode);
    assert.equal(w.document.documentElement.style.getPropertyValue("--surface"), theme.colors.surface);
    assert.equal(w.document.documentElement.style.getPropertyValue("--syntax-keyword"), theme.colors["syntax-keyword"]);
  }
}
setTheme("orchard");
setAppearanceMode("auto");
assert.equal(activeTheme(), "orchard");
systemAppearance.matches = true;
systemAppearance.dispatchEvent(new w.Event("change"));
assert.equal(activeTheme(), "orchard-dark");
assert.equal($("#editingPalette").textContent, "Editing Orchard · Dark");
setAppearanceMode("light");
systemAppearance.dispatchEvent(new w.Event("change"));
assert.equal(activeTheme(), "orchard");

// Overrides are tied to the active palette, including when Auto changes modes.
setTheme("paper");
setAppearanceMode("auto");
assert.equal(activeTheme(), "paper-dark");
const accentBefore = w.document.documentElement.style.getPropertyValue("--accent");
setThemeColor("baseline", "#008577");
setThemeColor("merge", "#fa0", "text");
assert.equal(colorField("merge").value, "#ffaa00");
assert.equal(w.document.documentElement.style.getPropertyValue("--baseline"), "#008577");
assert.equal(w.document.documentElement.style.getPropertyValue("--merge"), "#ffaa00");
assert.equal(w.document.documentElement.style.getPropertyValue("--accent"), accentBefore);
setThemeColor("merge", "invalid", "text");
assert.equal(colorField("merge", "text").getAttribute("aria-invalid"), "true");
assert.equal(w.document.documentElement.style.getPropertyValue("--merge"), "#ffaa00");
const softBefore = w.document.documentElement.style.getPropertyValue("--baseline-soft");
setThemeColor("surface", "#30343a");
setThemeColor("syntax-keyword", "#bfccee");
assert.equal(w.document.documentElement.style.getPropertyValue("--surface"), "#30343a");
assert.equal(w.document.documentElement.style.getPropertyValue("--syntax-keyword"), "#bfccee");
assert.notEqual(w.document.documentElement.style.getPropertyValue("--baseline-soft"), softBefore);

systemAppearance.matches = false;
systemAppearance.dispatchEvent(new w.Event("change"));
assert.equal(activeTheme(), "light");
assert.equal(colorField("baseline").value, "#385d83");
assert.equal(colorField("merge").value, "#7655ae");
setThemeColor("bg", "#aabbcc");
setThemeColor("baseline", "#aabbcc");
assert.equal($('meta[name="theme-color"]').content, "#aabbcc");
$("#resetThemeColors").click();
assert.equal(colorField("baseline").value, "#385d83");
assert.equal($('meta[name="theme-color"]').content, "#f6f7f9");
assert.equal(JSON.parse(localStorage.getItem("ferge-workbench")).themeColors.light, undefined);

setAppearanceMode("dark");
assert.equal(activeTheme(), "paper-dark");
assert.equal(colorField("baseline").value, "#008577");
assert.equal(colorField("merge").value, "#ffaa00");
assert.equal(colorField("surface").value, "#30343a");
setTheme("ink");
assert.equal(activeTheme(), "dark");
assert.equal(colorField("baseline").value, "#729bc7");
setTheme("paper");
assert.equal(colorField("baseline").value, "#008577");
assert.deepEqual($$(".code").map((el) => el.textContent), codeBeforeAppearance);
assert.equal($$(".pane-card").length, 4);

$("#closeSettings").click();
$("#settingsButton").click();
assert.equal(themeEditor.open, false);
$("#closeSettings").click();
assert.equal($("#settings").open, false);
const editButton = $$(".pane-card")[3].querySelector(
  '[data-pane-action="edit"]',
);
editButton.click();
assert.equal($("#fileEditor").open, true);
$("#editorName").value = "changed.py";
$("#editorText").value = 'def greet():\n    return "Ferge"';
$("#saveFileButton").click();
assert.equal($$(".pane-card").length, 4);
assert.ok($$(".pane-name").some((n) => n.textContent === "changed.py"));
assert.equal(
  $$(".pane-card")
    .find((p) => p.querySelector(".pane-name").textContent === "changed.py")
    .querySelector(".pane-language")
    .title.startsWith("Python"),
  true,
);
$("#shelfFiles").querySelector('[data-action="remove"]').click();
assert.equal($$(".pane-card").length, 3);
$("#shelfFiles").querySelector('[data-action="remove"]').click();
assert.equal($$(".pane-card").length, 2);
assert.equal(
  $$('#shelfFiles [data-action="remove"]').every((b) => !b.disabled),
  true,
);
const textFiles = [
  {
    name: "third.py",
    size: 20,
    type: "text/plain",
    text: async () => "def third():\n    return 3",
  },
  {
    name: "fourth.json",
    size: 9,
    type: "application/json",
    text: async () => '{"a":4}',
  },
];
$("#fileShelf").ondrop({
  preventDefault() {},
  dataTransfer: { files: textFiles },
});
await settle();
assert.equal($$(".pane-card").length, 4);
assert.ok($$(".pane-name").some((n) => n.textContent === "fourth.json"));
assert.ok($$(".pane-name").some((n) => n.textContent === "third.py"));
const savedBefore = localStorage.getItem("ferge-workbench");
$("#fileShelf").ondrop({
  preventDefault() {},
  dataTransfer: {
    files: [{ name: "fifth.txt", size: 1, text: async () => "5" }],
  },
});
await settle();
assert.equal($$(".pane-card").length, 4);
assert.equal(localStorage.getItem("ferge-workbench"), savedBefore);
assert.ok($("#toast").textContent.includes("already holds 4"));
const vp = $$(".code-viewport")[2];
vp.dispatchEvent(
  Object.assign(new w.Event("drop", { bubbles: true, cancelable: true }), {
    dataTransfer: {
      files: [
        {
          name: "replacement.py",
          size: 14,
          type: "text/plain",
          text: async () => 'print("hello")',
        },
      ],
    },
  }),
);
await settle();
assert.equal($$(".pane-card").length, 4);
assert.ok($$(".pane-name").some((n) => n.textContent === "replacement.py"));
const replacementCard = $$(".pane-card").find(
  (p) => p.querySelector(".pane-name").textContent === "replacement.py",
);
replacementCard.querySelector(".code-viewport").dispatchEvent(
  Object.assign(new w.Event("drop", { bubbles: true, cancelable: true }), {
    dataTransfer: {
      files: [
        {
          name: "picture.png",
          size: 10,
          type: "image/png",
          text: async () => "binary",
        },
      ],
    },
  }),
);
await settle();
assert.ok($$(".pane-name").some((n) => n.textContent === "replacement.py"));
assert.ok($("#toast").textContent.includes("Only text"));
$("#downloadButton").click();
assert.equal($$("#downloadOptions button").length, 4);
assert.equal($("#downloadMenu").hidden, false);
const s = JSON.parse(localStorage.getItem("ferge-workbench"));
assert.equal(s.files.length, 4);
assert.ok(s.baselineId && s.targetId);
assert.notEqual(s.baselineId, s.targetId);
assert.deepEqual(s.appearance, { theme: "paper", mode: "dark" });
assert.deepEqual(s.themeColors["paper-dark"], {
  baseline: "#008577", merge: "#ffaa00", surface: "#30343a", "syntax-keyword": "#bfccee",
});
assert.equal($$("#downloadOptions button")[0].dataset.download, s.baselineId);
assert.ok($$("#downloadOptions button")[0].textContent.includes("(baseline)"));
for (const file of s.files) await checkDownload(file);
// The tour can be replayed from Help and completed without changing any file.
const beforeReplay = localStorage.getItem("ferge-workbench");
$("#helpButton").click();
$("#startTour").click();
assert.equal($("#help").open, false);
for (let i = 0; i < 8; i++) $("#tourNext").click();
assert.equal($("#tourProgress").textContent, "9 of 9");
assert.equal($("#tourTitle").textContent, "Help me make more tools");
assert.ok($("#tourDescription").textContent.includes("Ko-fi or Buy Me a Coffee"));
assert.ok($("#tourDescription").textContent.includes("optional"));
assert.equal($("#tourNext").textContent, "Finish tour");
assert.equal(localStorage.getItem("ferge-workbench"), beforeReplay);
assert.equal($("#exampleChoice").open, false);
$("#tourBack").click();
assert.equal($("#tourProgress").textContent, "8 of 9");
w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
assert.equal($("#tourProgress").textContent, "9 of 9");
$("#tourNext").click();
assert.equal($(".tour-popover"), null);
assert.equal(localStorage.getItem("ferge-tour-v1"), "completed");
assert.equal($("#exampleChoice").open, false);
assert.equal(localStorage.getItem("ferge-workbench"), beforeReplay);
$("#helpButton").click();
$("#startTour").click();
w.document.dispatchEvent(
  new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
);
assert.equal($(".tour-popover"), null);
assert.equal($(".workbench").hasAttribute("inert"), false);
// Full-file downloads retain empty files, Unicode, CRLF and missing final newlines.
const fixtures = [
  { name: "résumé & notes.txt", text: "café ☕\r\n  spaced\ttext\r\nno final newline" },
  { name: "empty.txt", text: "" },
];
$("#openButton").click();
$("#fileInput").onchange({
  target: {
    files: fixtures.map((file) => ({
      name: file.name,
      size: new TextEncoder().encode(file.text).length,
      type: "text/plain",
      text: async () => file.text,
    })),
  },
});
await settle();
const imported = JSON.parse(localStorage.getItem("ferge-workbench"));
assert.equal(imported.files.length, 2);
for (let i = 0; i < fixtures.length; i++) {
  assert.equal(imported.files[i].text, fixtures[i].text);
  await checkDownload(imported.files[i]);
}
// Clear all is undoable, preserves preferences, and persists two unused drop panes.
const beforeClear = localStorage.getItem("ferge-workbench");
$("#clearAllButton").click();
const cleared = JSON.parse(localStorage.getItem("ferge-workbench"));
assert.ok(cleared.files.every((file) => file.placeholder && file.text === ""));
assert.equal(cleared.files.length, 2);
assert.notEqual(cleared.baselineId, cleared.targetId);
assert.equal(cleared.isExample, false);
assert.deepEqual(cleared.appearance, imported.appearance);
assert.deepEqual(cleared.themeColors, imported.themeColors);
assert.equal(cleared.textFont, "source-code-pro");
assert.equal($("#fileCount").textContent, "0 / 4");
assert.equal($$(".drop-empty").length, 2);
$("#undoButton").click();
assert.equal(localStorage.getItem("ferge-workbench"), beforeClear);
// Closing each remaining file works even when only two panes remain.
$("#shelfFiles").querySelector('[data-action="remove"]:not(:disabled)').click();
assert.equal($("#fileCount").textContent, "1 / 4");
assert.equal($("#downloadButton").disabled, false); // An actual empty file is downloadable.
$("#shelfFiles").querySelector('[data-action="remove"]:not(:disabled)').click();
assert.equal($("#fileCount").textContent, "0 / 4");
assert.equal($$(".pane-card").length, 2);
// A single shelf drop fills the first placeholder; Choose file fills the other.
const oneFile = { name: "first.txt", size: 5, type: "text/plain", text: async () => "first" };
$("#fileShelf").ondrop({ preventDefault() {}, dataTransfer: { files: [oneFile] } });
await settle();
assert.equal($$(".pane-card").length, 2);
assert.equal($$(".drop-empty").length, 1);
assert.equal($("#fileCount").textContent, "1 / 4");
assert.equal($$(".file-chip-grip").length, 0);
for (const mode of ["blocks", "unified", "fluid"]) {
  $(`[data-mode="${mode}"]`).click();
  $("#nextButton").click();
  $(".code-viewport").dispatchEvent(new w.Event("scroll"));
  await settle();
  assert.equal($$(".drop-empty").length, 1);
}
$(".drop-empty button").click();
$("#fileInput").onchange({ target: { files: [{ ...oneFile, name: "second.txt" }] } });
await settle();
assert.equal($$(".pane-card").length, 2);
assert.equal($$(".drop-empty").length, 0);
assert.equal($("#fileCount").textContent, "2 / 4");
// An edited blank pane becomes a real file, including when its text remains empty.
$("#clearAllButton").click();
$("#newButton").click();
$("#editorName").value = "blank.txt";
$("#editorText").value = "";
$("#saveFileButton").click();
assert.equal($$(".pane-card").length, 2);
assert.equal($$(".drop-empty").length, 1);
const blankFile = JSON.parse(localStorage.getItem("ferge-workbench")).files.find((file) => !file.placeholder);
await checkDownload(blankFile);
// Adding three files after clearing consumes the placeholders instead of rejecting the batch.
$("#clearAllButton").click();
$("#fileShelf").ondrop({ preventDefault() {}, dataTransfer: { files: [oneFile, ...textFiles] } });
await settle();
assert.equal($$(".pane-card").length, 3);
assert.equal($$(".drop-empty").length, 0);
assert.equal($("#fileCount").textContent, "3 / 4");
// Merging into an empty pane makes it a real, downloadable file.
$("#clearAllButton").click();
$("#fileShelf").ondrop({ preventDefault() {}, dataTransfer: { files: [oneFile] } });
await settle();
assert.equal($("#fromBaseline").disabled, false);
$("#fromBaseline").click();
assert.equal($$(".drop-empty").length, 0);
assert.equal($("#fileCount").textContent, "2 / 4");
const mergedIntoEmpty = JSON.parse(localStorage.getItem("ferge-workbench"));
const mergedTarget = mergedIntoEmpty.files.find((file) => file.id === mergedIntoEmpty.targetId);
assert.equal(mergedTarget.placeholder, undefined);
assert.equal(mergedTarget.text, "first");
await checkDownload(mergedTarget);
// Selecting an example is non-destructive; loading each distinct set replaces
// the documents in one undoable step while preserving appearance preferences.
const { exampleSets } = await import("../dist/demo.js");
assert.deepEqual([...$("#exampleSelect").options].map((option) => option.text), exampleSets.map((example) => example.label));
for (const example of exampleSets) {
  const beforeLoadText = localStorage.getItem("ferge-workbench");
  const beforeLoad = JSON.parse(beforeLoadText);
  $("#exampleSelect").value = example.id;
  $("#exampleSelect").dispatchEvent(new w.Event("change"));
  assert.equal($("#exampleDescription").textContent, example.description);
  assert.equal(localStorage.getItem("ferge-workbench"), beforeLoadText);
  $("#demoButton").click();
  const loaded = JSON.parse(localStorage.getItem("ferge-workbench"));
  assert.equal(loaded.files.length, example.files.length);
  assert.deepEqual(loaded.files.map(({ name, text, language }) => ({ name, text, language })),
    example.files.map(({ name, text, language = "auto" }) => ({ name, text, language })));
  assert.equal(loaded.baselineId, loaded.files[0].id);
  assert.equal(loaded.targetId, loaded.files[1].id);
  assert.equal(loaded.isExample, true);
  for (const key of ["appearance", "themeColors", "textFont", "wrap", "font", "syntax"])
    assert.deepEqual(loaded[key], beforeLoad[key]);
  for (const mode of ["blocks", "fluid", "unified"]) {
    $(`[data-mode="${mode}"]`).click();
    assert.equal($$(".pane-card").length, example.files.length);
    assert.deepEqual($$(".pane-name").map((pane) => pane.textContent), example.files.map((file) => file.name));
  }
  $(`[data-mode="${beforeLoad.mode}"]`).click();
  for (let attempts = 0; $("#fromBaseline").disabled && attempts < 20; attempts++) $("#nextButton").click();
  assert.equal($("#fromBaseline").disabled, false, `${example.label} must have a change to try merging`);
  const mergeTargetId = $("#targetSelect").value;
  $("#fromBaseline").click();
  const merged = JSON.parse(localStorage.getItem("ferge-workbench"));
  assert.equal(merged.isExample, false);
  assert.notEqual(merged.files.find((file) => file.id === mergeTargetId).text, loaded.files.find((file) => file.id === mergeTargetId).text);
  $("#undoButton").click();
  assert.deepEqual(JSON.parse(localStorage.getItem("ferge-workbench")).files, loaded.files);
  for (const file of loaded.files) await checkDownload(file);
  $("#startTour").click();
  for (let i = 0; i < 9; i++) $("#tourNext").click();
  assert.equal($("#exampleChoice").open, true);
  assert.ok($("#exampleChoice p").textContent.includes("Keep this example"));
  if (example.files.length === 2) {
    $("#clearExampleButton").click();
    assert.equal($("#fileCount").textContent, "0 / 4");
    $("#undoButton").click();
    assert.deepEqual(JSON.parse(localStorage.getItem("ferge-workbench")).files, loaded.files);
  } else $("#keepExampleButton").click();
  $("#undoButton").click();
  const restored = JSON.parse(localStorage.getItem("ferge-workbench"));
  for (const key of ["files", "baselineId", "targetId", "isExample", "appearance", "themeColors", "textFont"])
    assert.deepEqual(restored[key], beforeLoad[key]);
}
console.log(
  "Ferge DOM integration passed: four simultaneous panes, all layouts, baseline switching, scoped merge and undo, cross-token search, per-file syntax, theme editing, 2/3/4-file transitions, multi-drop, cap rejection, source replacement, image rejection, full-file downloads including merged contents, baseline, Unicode, CRLF, empty files and missing final newlines, tour completion choices, clear-all and individual closing with undo, placeholder imports and merges, six example sets with loading/merge/download/tour/undo checks, first-visit tour navigation/replay, and persistence.",
);
dom.window.close();
