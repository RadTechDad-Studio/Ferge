import { THEME_CHOICES, restoreAppearance, resolveAppearance } from "./themes.js?v=1.0-theme-editor";
import { createTour } from "./tour.js";
import { normalizeColor, selectionPalette } from "./selection-colors.js?v=1.0-theme-editor";
import { THEME_COLOR_GROUPS, restoreThemeColors } from "./theme-colors.js?v=1.0-theme-editor";
import {
  DEFAULT_TEXT_FONT, TEXT_FONTS, CUSTOM_TEXT_STACK,
  loadCustomTextFont, readCustomTextFont, saveCustomTextFont,
} from "./text-fonts.js?v=1.0-programming-fonts";
import { inlineParts } from "./diff.js";
import { demoFiles, exampleSets } from "./demo.js?v=1.0-example-library";
import {
  initSession,
  makeFile,
  addFiles,
  removeFile,
  clearFiles,
  setBaseline,
  setTarget,
  repairSelection,
  snapshotSession,
  validateTextFiles,
  MAX_FILES,
} from "./session.js";
import { buildComparison, mergeRegion, connectorType } from "./multidiff.js?v=1.0-pane-order";
import {
  highlightDocument,
  renderSyntaxLine,
  languages,
  languageLabel,
} from "./syntax.js";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const iconPaths = {
  folder: '<path d="M3 7V5h6l2 2h10v13H3z"/>',
  paste:
    '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="2" width="6" height="5" rx="1"/><path d="M9 12h6m-6 4h6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  settings:
    '<path d="M10.1 4.3L10.4 1.9 13.6 1.9 13.9 4.3 16.1 5.2 18 3.7 20.3 6 18.8 7.9 19.7 10.1 22.1 10.4 22.1 13.6 19.7 13.9 18.8 16.1 20.3 18 18 20.3 16.1 18.8 13.9 19.7 13.6 22.1 10.4 22.1 10.1 19.7 7.9 18.8 6 20.3 3.7 18 5.2 16.1 4.3 13.9 1.9 13.6 1.9 10.4 4.3 10.1 5.2 7.9 3.7 6 6 3.7 7.9 5.2Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>',
  shield: '<path d="m12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5zM8 11l3 3 5-6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  grip: '<path stroke-width="3" d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  mergeLeft: '<path d="M20 12H4m6-5-5 5 5 5"/>',
  mergeRight: '<path d="M4 12h16m-6-5 5 5-5 5"/>',
  undo: '<path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12"/>',
  link: '<path d="m10 14 4-4M8 15l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>',
  wrap: '<path d="M3 5h18M3 10h14a4 4 0 0 1 0 8h-5m3-3-3 3 3 3M3 15h4"/>',
  edit: '<path d="m15 3 6 6M4 20l1-6L16 3l5 5-11 11z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
for (const el of document.querySelectorAll("[data-icon]"))
  el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));

let stored;
for (const key of ["ferge-workbench", "kaleidoscope-comparison"]) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value) {
      stored = value;
      break;
    }
  } catch {}
}
const state = {
  mode: "fluid",
  selected: 0,
  font: 13,
  textFont: DEFAULT_TEXT_FONT,
  syntax: true,
  numbers: true,
  invisibles: false,
  wrap: false,
  ignore: false,
  sync: true,
  isExample: !stored,
};
for (const key of Object.keys(state))
  if (stored && key in stored) state[key] = stored[key];
Object.assign(
  state,
  initSession(stored, { a: demoFiles[0].text, b: demoFiles[1].text }),
);
if (!stored) {
  state.files = demoFiles.map((f) => makeFile(f.name, f.text));
  state.baselineId = state.files[0].id;
  state.targetId = state.files[1].id;
  repairSelection(state);
}
if (!["blocks", "fluid", "unified"].includes(state.mode)) state.mode = "fluid";
state.font = Math.max(10, Math.min(20, Number(state.font) || 13));
if (state.textFont !== "custom" && !TEXT_FONTS.has(state.textFont))
  state.textFont = DEFAULT_TEXT_FONT;
let customTextFont, fontForThisVisit = false;
let comparison,
  undo = [],
  syntaxCache = new Map(),
  syntaxViews = new Map(),
  editingId = null,
  importIntent = "open",
  importDestination = null,
  drawingFrame = 0,
  scrollLocked = false,
  matches = [],
  matchIndex = -1;
const letter = (id) =>
  String.fromCharCode(65 + state.files.findIndex((f) => f.id === id));
const byId = (id) => state.files.find((f) => f.id === id);
const viewport = (id) =>
  [...document.querySelectorAll(".pane-card")]
    .find((p) => p.dataset.file === id)
    ?.querySelector(".code-viewport");
const segmentEl = (id, gid) =>
  viewport(id)?.querySelector(`[data-group="${gid}"]`);
const currentGroup = () => comparison?.changes[state.selected];
const selectedFile = () => byId(state.targetId);
const loadedFiles = () => state.files.filter((f) => !f.placeholder);
function save() {
  try {
    const session = fontForThisVisit && state.textFont === "custom"
      ? { ...state, textFont: DEFAULT_TEXT_FONT }
      : state;
    localStorage.setItem("ferge-workbench", JSON.stringify(session));
    $("savedState").textContent = "Saved in browser";
    $("savedState").title =
      "Your session is saved in this browser. Files on disk are not updated automatically. Use Download file to save your changes.";
  } catch {
    $("savedState").textContent = "Session not saved";
    $("savedState").title =
      "Browser storage is full or unavailable. Download your files before closing.";
  }
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").classList.remove("visible"), 3600);
}
function snapshot() {
  undo.push({ ...snapshotSession(state), isExample: state.isExample });
  if (undo.length > 24) undo.shift();
}
function clearWorkspace() {
  if (!loadedFiles().length) return;
  snapshot();
  clearFiles(state);
  syntaxCache.clear();
  state.isExample = false;
  state.selected = 0;
  closeDownloadMenu();
  render();
  toast("All files closed · Undo restores them");
}
function syntaxFor(file) {
  const prev = syntaxCache.get(file.id);
  if (
    prev &&
    prev.text === file.text &&
    prev.name === file.name &&
    prev.language === file.language &&
    prev.enabled === state.syntax
  )
    return prev.value;
  const value = highlightDocument(
    file.text,
    file.name,
    file.language,
    state.syntax,
  );
  syntaxCache.set(file.id, { ...file, enabled: state.syntax, value });
  return value;
}
const media =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-color-scheme: dark)")
    : null;
state.appearance = restoreAppearance(stored, media?.matches);
state.themeColors = restoreThemeColors(stored);
const themeColorFields = new Map();
function applyTheme(syncInputs = true) {
  const theme = resolveAppearance(state.appearance, media?.matches);
  const root = document.documentElement;
  const colors = { ...theme.colors, ...theme.selection, ...state.themeColors[theme.id] };
  root.dataset.theme = theme.id;
  root.dataset.colorScheme = theme.scheme;
  root.style.colorScheme = theme.scheme;
  for (const [name, value] of Object.entries(colors))
    root.style.setProperty("--" + name, value);
  const shadowAlpha = theme.scheme === "dark" ? "44" : "14";
  root.style.setProperty("--shadow", `0 12px 40px ${colors["shadow-color"]}${shadowAlpha}`);
  document.querySelector('meta[name="theme-color"]').content = colors.bg;
  const roles = selectionPalette(theme.id, {
    baselineColor: colors.baseline,
    mergeColor: colors.merge,
  }, colors.surface);
  for (const [role, color] of Object.entries(roles)) {
    root.style.setProperty(`--${role}-soft`, color.soft);
    root.style.setProperty(`--${role}-on`, color.on);
    root.style.setProperty(`--${role}-border`, color.border);
  }
  if (!syncInputs) return;
  $("editingPalette").textContent = `Editing ${theme.name} · ${theme.scheme === "dark" ? "Dark" : "Light"}`;
  for (const [name, { picker, hex }] of themeColorFields) {
    picker.value = hex.value = colors[name];
    hex.removeAttribute("aria-invalid");
  }
}
media?.addEventListener?.("change", () => {
  if (state.appearance.mode === "auto") {
    applyTheme();
    scheduleDraw();
  }
});
function fileOptions(exclude) {
  return state.files
    .filter((f) => f.id !== exclude)
    .map(
      (f) =>
        `<option value="${f.id}">${letter(f.id)} · ${esc(f.name)}</option>`,
    )
    .join("");
}
function renderShelf() {
  endShelfDrag();
  const count = loadedFiles().length;
  $("fileCount").textContent = `${count} / ${MAX_FILES}`;
  $("shelfFiles").innerHTML = state.files
    .map(
      (f) =>
        `<article class="file-chip ${f.id === state.baselineId ? "is-baseline" : ""} ${f.id === state.targetId ? "is-target" : ""}" data-file="${f.id}">
          ${count > 1 && !f.placeholder ? `<button type="button" class="file-chip-grip" aria-label="Reorder ${esc(f.name)}" aria-keyshortcuts="ArrowLeft ArrowRight" title="Drag to reorder, or press ← or →">${icon("grip")}</button>` : ""}
          <span class="file-letter">${letter(f.id)}</span><button class="file-chip-name" data-action="edit" aria-label="Edit ${esc(f.name)}"><strong title="${esc(f.name)}">${esc(f.name)}</strong><small>${f.placeholder ? "EMPTY PANE" : f.id === state.baselineId ? "BASELINE" : `${f.text === "" ? 0 : f.text.split("\n").length} LINES`}</small></button><button data-action="remove" title="${state.files.length <= 2 ? "Close file and leave an empty pane" : "Remove file"}" aria-label="Remove ${esc(f.name)}" ${f.placeholder ? "disabled" : ""}>${icon("close")}</button></article>`,
    )
    .join("");
  for (const id of ["addButton", "newButton"])
    $(id).disabled = loadedFiles().length >= MAX_FILES;
  $("clearAllButton").disabled = !loadedFiles().length;
  $("downloadButton").disabled = !loadedFiles().length;
  $("baselineSelect").innerHTML = fileOptions();
  $("baselineSelect").value = state.baselineId;
  $("targetSelect").innerHTML = fileOptions(state.baselineId);
  $("targetSelect").value = state.targetId;
  $("layoutHint").textContent =
    `Every file compared with baseline ${letter(state.baselineId)}.`;
  $("comparisonSummary").textContent =
    loadedFiles().length
      ? `${loadedFiles().length} file${loadedFiles().length === 1 ? "" : "s"} · ${comparison.changes.length} change region${comparison.changes.length === 1 ? "" : "s"}`
      : "Drop files into the empty panes to begin.";
}
function rowHTML(row) {
  let range = null;
  if (row.type === "changed" && row.other !== undefined) {
    const [prefix, changed] = inlineParts(row.text, row.other);
    range = [prefix.length, prefix.length + changed.length];
  }
  const syntax = syntaxViews.get(row.sourceId);
  return `<div class="code-line ${row.type}"><span class="num">${row.line + 1}</span><span class="sign">${row.type === "added" ? "+" : row.type === "deleted" ? "−" : row.type === "changed" ? "~" : ""}</span><span class="text">${renderSyntaxLine(row.text, syntax?.lines[row.line], range, state.invisibles)}</span></div>`;
}
function segmentHTML(group, file) {
  const s = group.segments.get(file.id),
    rows =
      state.mode === "unified" && file.id !== state.baselineId
        ? s.unified
        : s.rows;
  return `<div class="segment ${s.type} ${rows.length ? "" : "empty"}" data-group="${group.id}" data-change="${group.index}">${rows.map(rowHTML).join("")}</div>`;
}
function paneHTML(file) {
  const isBase = file.id === state.baselineId,
    syntax = syntaxViews.get(file.id),
    count = comparison.pairs.get(file.id)?.changes.length || 0;
  const caption = isBase
    ? "Baseline · all files compared here"
    : `${count} change${count === 1 ? "" : "s"} vs ${letter(state.baselineId)}${state.mode === "unified" ? " · unified" : ""}`;
  const content = file.placeholder
    ? `<div class="empty-state drop-empty">${icon("folder")}<strong>Drop a file here</strong><span>Compare your own text or source files.</span><button data-pane-action="open" class="primary" aria-label="Choose a file for pane ${letter(file.id)}">Choose file</button></div>`
    : comparison.groups.map((g) => segmentHTML(g, file)).join("") +
      (file.text === "" ? '<div class="empty-state">Empty text file</div>' : "");
  return `<section class="pane-card ${file.placeholder ? "is-placeholder" : ""} ${isBase ? "is-baseline" : ""} ${file.id === state.targetId ? "is-target" : ""}" data-file="${file.id}" aria-label="File ${letter(file.id)}: ${esc(file.name)}${isBase ? ", baseline" : ", compared with baseline " + letter(state.baselineId)}"><header class="pane-header"><div class="pane-heading"><span class="file-letter">${letter(file.id)}</span><div><div class="pane-name" title="${esc(file.name)}">${esc(file.name)}</div><div class="pane-subtitle"><span class="merge-target-label"${file.id === state.targetId ? "" : " hidden"}>Merge target</span><span class="pane-comparison-caption">${caption}</span></div></div></div><div class="pane-header-actions"><select class="pane-language" data-language="${file.id}" aria-label="Syntax language for file ${letter(file.id)}" title="${languageLabel(syntax.language)} · ${syntax.source}"><option value="auto">Auto · ${languageLabel(syntax.language)}</option>${languages.map(([id, label]) => `<option value="${id}" ${file.language === id ? "selected" : ""}>${label}</option>`).join("")}</select><button data-pane-action="edit" title="Edit file ${letter(file.id)}" aria-label="Edit file ${letter(file.id)}">${icon("edit")}</button>${!isBase ? `<button data-pane-action="target" aria-pressed="${file.id === state.targetId}" title="Use file ${letter(file.id)} for merging" aria-label="Use file ${letter(file.id)} for merging">${icon("target")}</button>` : ""}</div></header><div class="pane-body"><div class="code-viewport" tabindex="0" aria-label="Text of file ${letter(file.id)}"><div class="code">${content}</div></div><div class="overview" aria-label="Changes in file ${letter(file.id)}"></div></div></section>`;
}
function render(recompute = true) {
  const scrolls = new Map(
    [...document.querySelectorAll(".pane-card")].map((p) => [
      p.dataset.file,
      {
        top: p.querySelector(".code-viewport").scrollTop,
        left: p.querySelector(".code-viewport").scrollLeft,
      },
    ]),
  );
  repairSelection(state);
  if (recompute || !comparison)
    comparison = buildComparison(state.files, state.baselineId, state.ignore);
  syntaxViews = new Map(state.files.map((f) => [f.id, syntaxFor(f)]));
  state.selected = Math.max(
    0,
    Math.min(state.selected, comparison.changes.length - 1),
  );
  applyTheme();
  document.documentElement.style.setProperty("--code-size", state.font + "px");
  document.documentElement.style.setProperty(
    "--line-height",
    state.font + 11 + "px",
  );
  document
    .querySelector(".workbench")
    .classList.toggle("no-numbers", !state.numbers);
  document.querySelector(".workbench").classList.toggle("wrap", state.wrap);
  renderShelf();
  $("comparisonGrid").style.gridTemplateColumns =
    `repeat(${state.files.length},minmax(280px,1fr))`;
  $("comparisonGrid").style.minWidth =
    state.files.length * 280 + (state.files.length - 1) * 30 + "px";
  $("comparisonGrid").innerHTML =
    comparison.ordered.map(paneHTML).join("") +
    '<svg class="connection-layer" aria-label="Connections between corresponding change regions"></svg>';
  for (const pane of document.querySelectorAll(".pane-card")) {
    const id = pane.dataset.file,
      v = pane.querySelector(".code-viewport"),
      prev = scrolls.get(id);
    if (prev) {
      v.scrollTop = prev.top;
      v.scrollLeft = prev.left;
    }
    pane.querySelector(".pane-language").value = byId(id).language;
    v.addEventListener("scroll", () => onScroll(id));
    v.addEventListener("click", (e) => {
      const s = e.target.closest("[data-change]");
      if (id !== state.baselineId) {
        setTarget(state, id);
        updateTargetControls();
      }
      if (s && +s.dataset.change >= 0) selectChange(+s.dataset.change, false);
    });
    v.addEventListener("dragover", (e) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      v.classList.add("drop-target");
    });
    v.addEventListener("dragleave", () => v.classList.remove("drop-target"));
    v.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      v.classList.remove("drop-target");
      const files = [...e.dataTransfer.files];
      if (files.length > 1) loadFiles(files, null, "open");
      else loadFiles(files, id, "replace");
    });
    pane.querySelector(".overview").onclick = (e) => {
      const b = e.target.closest("[data-change]");
      if (b) {
        if (id !== state.baselineId) setTarget(state, id);
        selectChange(+b.dataset.change, true);
      }
    };
  }
  for (const b of document.querySelectorAll("[data-mode]"))
    b.setAttribute("aria-pressed", b.dataset.mode === state.mode);
  for (const [key, id] of [
    ["syntax", "syntaxToggle"],
    ["numbers", "numbersToggle"],
    ["invisibles", "invisiblesToggle"],
    ["ignore", "ignoreToggle"],
    ["wrap", "wrapToggle"],
    ["sync", "syncToggle"],
  ])
    $(id).checked = state[key];
  $("fontSize").textContent = state.font;
  $("undoButton").disabled = !undo.length;
  $("syncButton").setAttribute("aria-pressed", state.sync);
  $("wrapButton").setAttribute("aria-pressed", state.wrap);
  alignBlocks();
  updateTargetControls();
  search(false);
  scheduleDraw();
  save();
}
function alignBlocks() {
  if (state.mode !== "blocks") return;
  for (const g of comparison.groups) {
    const els = comparison.ordered.map((f) => segmentEl(f.id, g.id)).filter(Boolean);
    for (const el of els) {
      el.style.minHeight = "";
      el.classList.remove("empty");
    }
    const height = Math.max(
      ...els.map((el) => el.getBoundingClientRect().height),
    );
    for (const el of els) el.style.minHeight = height + "px";
  }
}
function updateTargetControls() {
  const g = currentGroup(),
    target = selectedFile(),
    base = comparison.baseline;
  $("targetSelect").value = state.targetId;
  $("targetSelect").parentElement.classList.toggle(
    "baseline-on-right",
    comparison.ordered.indexOf(base) > comparison.ordered.indexOf(target),
  );
  $("changeCount").textContent = comparison.changes.length
    ? `Change ${state.selected + 1} of ${comparison.changes.length}`
    : "No differences";
  for (const id of ["previousButton", "nextButton"])
    $(id).disabled = !comparison.changes.length;
  const canMerge = g && g.segments.get(state.targetId)?.type !== "equal";
  for (const id of ["toBaseline", "fromBaseline"]) $(id).disabled = !canMerge;
  $("toBaseline").title =
    `Copy selected region from ${letter(target.id)} (${target.name}) to ${letter(base.id)} (${base.name})`;
  $("fromBaseline").title =
    `Copy selected region from ${letter(base.id)} (${base.name}) to ${letter(target.id)} (${target.name})`;
  $("toBaseline").setAttribute(
    "aria-label",
    `Copy selected change from ${letter(target.id)} to baseline ${letter(base.id)}`,
  );
  $("fromBaseline").setAttribute(
    "aria-label",
    `Copy selected change from baseline ${letter(base.id)} to ${letter(target.id)}`,
  );
  for (const p of document.querySelectorAll(".pane-card")) {
    const active = p.dataset.file === state.targetId;
    p.classList.toggle("is-target", active);
    const badge = p.querySelector(".merge-target-label");
    if (badge) badge.hidden = !active;
    const targetButton = p.querySelector('[data-pane-action="target"]');
    if (targetButton)
      targetButton.title = active
        ? `Merge target: file ${letter(p.dataset.file)}`
        : `Use file ${letter(p.dataset.file)} for merging`;
    targetButton?.setAttribute("aria-pressed", active);
  }
  for (const el of document.querySelectorAll(".segment"))
    el.classList.toggle(
      "selected",
      Number(el.dataset.change) === state.selected &&
        Number(el.dataset.change) >= 0,
    );
  for (const el of document.querySelectorAll(".file-chip"))
    el.classList.toggle("is-target", el.dataset.file === state.targetId);
}
function selectChange(index, navigate = false) {
  if (!comparison.changes.length) return;
  state.selected =
    (index + comparison.changes.length) % comparison.changes.length;
  const g = currentGroup();
  if (navigate && g.segments.get(state.targetId).type === "equal") {
    const f = comparison.ordered.find(
      (f) => f.id !== state.baselineId && g.segments.get(f.id).type !== "equal",
    );
    if (f) setTarget(state, f.id);
  }
  updateTargetControls();
  if (navigate) {
    scrollLocked = true;
    for (const f of comparison.ordered) {
      const v = viewport(f.id),
        el = segmentEl(f.id, g.id);
      if (!el) continue;
      v.scrollTop = Math.max(0, el.offsetTop - 80);
    }
    requestAnimationFrame(() => {
      scrollLocked = false;
      scheduleDraw();
    });
  }
  scheduleDraw();
  save();
}
function scheduleDraw() {
  cancelAnimationFrame(drawingFrame);
  drawingFrame = requestAnimationFrame(draw);
}
function draw() {
  if (!comparison) return;
  const grid = $("comparisonGrid"),
    svg = grid.querySelector(".connection-layer");
  if (!svg) return;
  const r = svg.getBoundingClientRect(),
    gr = grid.getBoundingClientRect(),
    width = grid.clientWidth,
    height = svg.clientHeight;
  svg.setAttribute(
    "viewBox",
    `0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`,
  );
  const css = getComputedStyle(document.documentElement),
    colors = {
      added: css.getPropertyValue("--added").trim() || "#35804d",
      deleted: css.getPropertyValue("--deleted").trim() || "#b25d53",
      changed: css.getPropertyValue("--changed").trim() || "#467fb4",
    };
  let paths = "";
  for (let i = 1; i < comparison.ordered.length; i++) {
    const left = comparison.ordered[i - 1],
      right = comparison.ordered[i];
    if (left.placeholder || right.placeholder) continue;
    const lp = viewport(left.id).closest(".pane-card").getBoundingClientRect(),
      rp = viewport(right.id).closest(".pane-card").getBoundingClientRect(),
      x0 = lp.right - gr.left,
      x1 = rp.left - gr.left,
      w = x1 - x0;
    for (const group of comparison.changes) {
      const type = connectorType(
        group.segments.get(left.id),
        group.segments.get(right.id),
        state.ignore,
      );
      if (type === "equal") continue;
      const a = segmentEl(left.id, group.id).getBoundingClientRect(),
        b = segmentEl(right.id, group.id).getBoundingClientRect(),
        a0 = a.top - r.top,
        a1 = a.bottom - r.top,
        b0 = b.top - r.top,
        b1 = b.bottom - r.top;
      if (Math.max(a1, b1) < 0 || Math.min(a0, b0) > height) continue;
      const sel = group.index === state.selected,
        c = colors[type],
        curve = (y, z) =>
          `C${x0 + w * 0.45} ${y},${x1 - w * 0.45} ${z},${x1} ${z}`;
      paths += `<g class="ribbon" data-change="${group.index}" role="button" tabindex="0" aria-label="Select change ${group.index + 1}, ${letter(left.id)} to ${letter(right.id)}"><title>Corresponding region ${group.index + 1}: ${letter(left.id)} ↔ ${letter(right.id)}. Highlights use baseline ${letter(state.baselineId)}.</title><path d="M${x0} ${a0} ${curve(a0, b0)} L${x1} ${b1} C${x1 - w * 0.45} ${b1},${x0 + w * 0.45} ${a1},${x0} ${a1} Z" fill="${c}" fill-opacity="${sel ? 0.13 : 0.045}"/><path d="M${x0} ${a0} ${curve(a0, b0)} M${x0} ${a1} ${curve(a1, b1)}" fill="none" stroke="${c}" stroke-width="${sel ? 1.8 : 1.15}" opacity="${sel ? 1 : 0.5}"/><path d="M${x0} ${(a0 + a1) / 2} ${curve((a0 + a1) / 2, (b0 + b1) / 2)}" fill="none" stroke="transparent" stroke-width="12"/></g>`;
    }
  }
  svg.innerHTML = paths;
  svg.onclick = (e) => {
    const el = e.target.closest("[data-change]");
    if (el) selectChange(+el.dataset.change, true);
  };
  svg.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const el = e.target.closest("[data-change]");
      if (el) {
        e.preventDefault();
        selectChange(+el.dataset.change, true);
      }
    }
  };
  for (const f of comparison.ordered) {
    const v = viewport(f.id),
      total = Math.max(v.querySelector(".code").scrollHeight, 1),
      overview = v.parentElement.querySelector(".overview");
    if (f.placeholder) {
      overview.innerHTML = "";
      continue;
    }
    overview.innerHTML = comparison.changes
      .filter((g) => g.segments.get(f.id).type !== "equal")
      .map((g) => {
        const el = segmentEl(f.id, g.id),
          s = g.segments.get(f.id);
        return `<button class="${s.type} ${g.index === state.selected ? "selected" : ""}" data-change="${g.index}" style="top:${(el.offsetTop / total) * 100}%;height:${Math.max(0.4, (el.offsetHeight / total) * 100)}%" aria-label="Go to change ${g.index + 1}"></button>`;
      })
      .join("");
  }
}
function onScroll(id) {
  if (state.sync && !scrollLocked) {
    scrollLocked = true;
    const source = viewport(id),
      all = [...source.querySelectorAll(".segment")],
      at = source.scrollTop + 16,
      el = all.find((e) => e.offsetTop + e.offsetHeight > at) || all.at(-1);
    if (el) {
      const fraction = Math.max(
        0,
        Math.min(1, (at - el.offsetTop) / Math.max(el.offsetHeight, 1)),
      );
      for (const f of comparison.ordered) {
        if (f.id === id) continue;
        const other = viewport(f.id),
          target = segmentEl(f.id, el.dataset.group);
        if (!target) continue;
        other.scrollTop = Math.max(
          0,
          target.offsetTop + fraction * target.offsetHeight - 16,
        );
      }
    }
    requestAnimationFrame(() => {
      scrollLocked = false;
    });
  }
  scheduleDraw();
}
$("comparisonGrid").addEventListener("click", (e) => {
  const action = e.target.closest("[data-pane-action]"),
    pane = e.target.closest(".pane-card");
  if (!action || !pane) return;
  if (action.dataset.paneAction === "edit") openEditor(pane.dataset.file);
  else if (action.dataset.paneAction === "open") {
    importDestination = pane.dataset.file;
    importIntent = "replace";
    $("fileInput").click();
  }
  else {
    setTarget(state, pane.dataset.file);
    updateTargetControls();
    save();
  }
});
$("comparisonGrid").addEventListener("change", (e) => {
  if (e.target.matches("[data-language]")) {
    byId(e.target.dataset.language).language = e.target.value;
    render(false);
  }
});
$("shelfFiles").onclick = (e) => {
  const el = e.target.closest("[data-action]"),
    card = e.target.closest("[data-file]");
  if (!el || !card) return;
  const id = card.dataset.file;
  if (el.dataset.action === "edit") openEditor(id);
  else {
    if (byId(id)?.placeholder) return;
    snapshot();
    removeFile(state, id);
    syntaxCache.delete(id);
    state.isExample = false;
    render();
  }
};
const fileCards = $("shelfFiles");
let shelfDrag, dropMarker;

function clearDropMarker() {
  dropMarker?.classList.remove("is-drop-destination");
  dropMarker = null;
}

function endShelfDrag() {
  clearDropMarker();
  if (!shelfDrag) return;
  const { card, pointerId, preview } = shelfDrag;
  shelfDrag = null;
  preview?.remove();
  card.classList.remove("is-dragging");
  fileCards.classList.remove("is-reordering");
  if (fileCards.hasPointerCapture(pointerId)) fileCards.releasePointerCapture(pointerId);
}

function moveShelfFile(from, to) {
  if (from === to || !state.files[from] || !state.files[to]) return;
  snapshot();
  const [file] = state.files.splice(from, 1);
  state.files.splice(to, 0, file);
  closeDownloadMenu();
  render();
  fileCards.children[to].querySelector(".file-chip-grip").focus();
  toast(`${file.name} moved to position ${to + 1} of ${state.files.length}`);
}

function updateShelfDrag(e) {
  if (e.pointerId !== shelfDrag?.pointerId) return;
  if (!shelfDrag.active) {
    if (Math.hypot(e.clientX - shelfDrag.startX, e.clientY - shelfDrag.startY) < 5) return;
    shelfDrag.active = true;
    const rect = shelfDrag.card.getBoundingClientRect();
    const preview = shelfDrag.card.cloneNode(true);
    preview.classList.add("shelf-drag-preview");
    preview.removeAttribute("data-file");
    preview.setAttribute("aria-hidden", "true");
    preview.inert = true;
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${rect.height}px`;
    document.body.append(preview);
    shelfDrag.preview = preview;
    shelfDrag.offsetX = shelfDrag.startX - rect.x;
    shelfDrag.offsetY = shelfDrag.startY - rect.y;
    shelfDrag.card.classList.add("is-dragging");
    fileCards.classList.add("is-reordering");
  }
  shelfDrag.preview.style.transform = `translate3d(${e.clientX - shelfDrag.offsetX}px, ${e.clientY - shelfDrag.offsetY}px, 0)`;
  clearDropMarker();
  const { left, right, top, bottom } = fileCards.getBoundingClientRect();
  if (e.clientX < left || e.clientX > right || e.clientY < top || e.clientY > bottom) return;
  const cards = [...fileCards.children];
  const from = cards.indexOf(shelfDrag.card);
  // Each card is a destination position, including its whole width. Split only
  // the gaps between cards so adjacent moves cannot fall into a no-op half.
  const next = cards.findIndex((card, index) => {
    const { x, width } = card.getBoundingClientRect();
    const nextX = cards[index + 1]?.getBoundingClientRect().x ?? x + width;
    return e.clientX < (x + width + nextX) / 2;
  });
  const to = next === -1 ? cards.length - 1 : next;
  if (from === to) return;
  dropMarker = cards[to];
  dropMarker.classList.add("is-drop-destination");
  return { from, to };
}

fileCards.onpointerdown = (e) => {
  const grip = e.target.closest(".file-chip-grip");
  if (!grip || !e.isPrimary || e.button !== 0) return;
  shelfDrag = { card: grip.closest(".file-chip"), pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false };
  fileCards.setPointerCapture(e.pointerId);
};
fileCards.onpointermove = updateShelfDrag;
fileCards.onpointerup = (e) => {
  if (e.pointerId !== shelfDrag?.pointerId) return;
  const position = updateShelfDrag(e);
  endShelfDrag();
  if (position) moveShelfFile(position.from, position.to);
};
fileCards.onpointercancel = fileCards.onlostpointercapture = (e) => {
  if (e.pointerId === shelfDrag?.pointerId) endShelfDrag();
};
fileCards.onkeydown = (e) => {
  const grip = e.target.closest(".file-chip-grip");
  if (!grip || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
  e.preventDefault();
  const from = state.files.findIndex((f) => f.id === grip.closest(".file-chip").dataset.file);
  moveShelfFile(from, from + (e.key === "ArrowLeft" ? -1 : 1));
};
$("baselineSelect").onchange = (e) => {
  setBaseline(state, e.target.value);
  state.selected = 0;
  render();
};
$("targetSelect").onchange = (e) => {
  setTarget(state, e.target.value);
  updateTargetControls();
  save();
};
for (const b of document.querySelectorAll("[data-mode]"))
  b.onclick = () => {
    state.mode = b.dataset.mode;
    render(false);
  };
$("previousButton").onclick = () => selectChange(state.selected - 1, true);
$("nextButton").onclick = () => selectChange(state.selected + 1, true);
function merge(toBase) {
  const g = currentGroup();
  if (!g || g.segments.get(state.targetId).type === "equal") return;
  snapshot();
  const result = mergeRegion(
    comparison,
    comparison.groups.indexOf(g),
    state.targetId,
    toBase,
  );
  byId(result.id).text = result.text;
  if (byId(result.id).placeholder) byId(result.id).name = "Untitled.txt";
  delete byId(result.id).placeholder;
  state.isExample = false;
  render();
  toast(`Region copied to ${letter(result.id)} · ${byId(result.id).name}`);
}
$("toBaseline").onclick = () => merge(true);
$("fromBaseline").onclick = () => merge(false);
$("undoButton").onclick = () => {
  const old = undo.pop();
  if (old) {
    Object.assign(state, old);
    render();
    toast("Last file change undone");
  }
};
function openEditor(id = null, text) {
  editingId = id;
  const f = id ? byId(id) : null;
  $("editorTitle").textContent = f
    ? "Edit " + letter(id) + " · " + f.name
    : "Add text to Ferge";
  $("editorName").value = f && !f.placeholder ? f.name : "Untitled.txt";
  $("editorText").value = text ?? f?.text ?? "";
  $("destinationLabel").hidden = !!f;
  $("editorDestination").innerHTML =
    (state.files.length < MAX_FILES
      ? '<option value="new">New file</option>'
      : "") + fileOptions();
  $("editorDestination").value =
    state.files.find((file) => file.placeholder)?.id ||
    (state.files.length < MAX_FILES ? "new" : state.targetId);
  $("saveFileButton").textContent = f ? "Apply changes" : "Use this text";
  $("fileEditor").showModal();
  $("editorText").focus();
}
$("saveFileButton").onclick = () => {
  const text = $("editorText").value;
  if (new Blob([text]).size > 1000000) {
    toast("Please use text smaller than 1 MB.");
    return;
  }
  const name = $("editorName").value.trim() || "Untitled.txt",
    destination = editingId || $("editorDestination").value;
  if (destination === "new" && state.files.length >= MAX_FILES) {
    toast("Remove a file before adding another.");
    return;
  }
  snapshot();
  if (destination === "new") {
    const [f] = addFiles(state, [{ name, text }]);
    setTarget(state, f.id);
  } else {
    const f = byId(destination);
    if (!f) {
      undo.pop();
      return;
    }
    Object.assign(f, { name, text, language: "auto" });
    delete f.placeholder;
  }
  state.isExample = false;
  state.selected = 0;
  $("fileEditor").close();
  render();
};
$("newButton").onclick = () => openEditor();
$("clearAllButton").onclick = clearWorkspace;
$("pasteButton").onclick = async () => {
  try {
    const text = await navigator.clipboard.readText();
    openEditor(null, text);
  } catch {
    openEditor(null, "");
    toast("Paste your text into the editor.");
  }
};
async function loadFiles(files, id = null, intent = "add") {
  if (!files.length) return;
  try {
    validateTextFiles(
      files,
      id ? 1 : intent === "add" ? MAX_FILES - loadedFiles().length : MAX_FILES,
    );
    const texts = await Promise.all(files.map((f) => f.text()));
    if (texts.some((t) => t.includes("\u0000") || t.includes("\ufffd")))
      throw new Error("Choose UTF-8 text or source-code files.");
    snapshot();
    if (id) {
      Object.assign(byId(id), {
        name: files[0].name,
        text: texts[0],
        language: "auto",
      });
      delete byId(id).placeholder;
    } else if (intent === "open" && files.length >= 2) {
      state.files = files.map((f, i) => makeFile(f.name, texts[i]));
      state.baselineId = state.files[0].id;
      state.targetId = state.files[1].id;
      repairSelection(state);
    } else if (intent === "open" && loadedFiles().length >= MAX_FILES) {
      Object.assign(selectedFile(), {
        name: files[0].name,
        text: texts[0],
        language: "auto",
      });
    } else {
      const added = addFiles(
        state,
        files.map((f, i) => ({ name: f.name, text: texts[i] })),
      );
      setTarget(state, added.at(-1).id);
    }
    state.isExample = false;
    state.selected = 0;
    render();
    toast(
      `${loadedFiles().length} file${loadedFiles().length === 1 ? "" : "s"} loaded · baseline ${letter(state.baselineId)}`,
    );
  } catch (error) {
    toast(error.message);
  }
}
$("openButton").onclick = () => {
  importDestination = null;
  importIntent = "open";
  $("fileInput").click();
};
$("addButton").onclick = () => {
  importDestination = null;
  importIntent = "add";
  $("fileInput").click();
};
$("fileInput").onchange = (e) => {
  loadFiles([...e.target.files], importDestination, importIntent);
  importDestination = null;
  e.target.value = "";
};
$("fileShelf").ondragover = (e) => {
  if (!e.dataTransfer?.types.includes("Files")) return;
  e.preventDefault();
  $("fileShelf").classList.add("drop-target");
};
$("fileShelf").ondragleave = (e) => {
  if (!$("fileShelf").contains(e.relatedTarget))
    $("fileShelf").classList.remove("drop-target");
};
$("fileShelf").ondrop = (e) => {
  e.preventDefault();
  $("fileShelf").classList.remove("drop-target");
  const files = [...e.dataTransfer.files];
  loadFiles(files, null, state.isExample && files.length >= 2 ? "open" : "add");
};
$("editorText").ondragover = (e) => e.preventDefault();
$("editorText").ondrop = async (e) => {
  e.preventDefault();
  try {
    const files = [...e.dataTransfer.files];
    validateTextFiles(files, 1);
    if (!files.length) return;
    const text = await files[0].text();
    if (text.includes("\u0000")) throw new Error("Choose a text file.");
    $("editorText").value = text;
    $("editorName").value = files[0].name;
  } catch (error) {
    toast(error.message);
  }
};
// Catch drops outside a source or shelf so the browser does not navigate away to the file.
document.addEventListener("dragover", (e) => {
  if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
});
document.addEventListener("drop", (e) => {
  if (e.defaultPrevented || !e.dataTransfer?.files?.length) return;
  e.preventDefault();
  if ($("settings").open) return;
  loadFiles([...e.dataTransfer.files], null, "open");
});
function closeDownloadMenu() {
  $("downloadMenu").hidden = true;
  $("downloadButton").setAttribute("aria-expanded", false);
}
const settingsTabs = [$("generalTab"), $("appearanceTab")];
function selectSettingsTab(selected) {
  for (const tab of settingsTabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", active);
    tab.tabIndex = active ? 0 : -1;
    $(tab.getAttribute("aria-controls")).hidden = !active;
  }
  selected.focus();
}
for (const tab of settingsTabs) {
  tab.onclick = () => selectSettingsTab(tab);
  tab.onkeydown = (e) => {
    const otherTab = settingsTabs.find((item) => item !== tab);
    const keys = {
      ArrowUp: otherTab,
      ArrowDown: otherTab,
      Home: settingsTabs[0],
      End: settingsTabs.at(-1),
    };
    if (!Object.hasOwn(keys, e.key)) return;
    e.preventDefault();
    selectSettingsTab(keys[e.key]);
  };
}
$("settingsButton").onclick = () => {
  closeDownloadMenu();
  $("themeEditor").open = false;
  $("settings").showModal();
  const activeTab = settingsTabs.find((tab) => tab.tabIndex === 0);
  activeTab.focus();
};
$("closeSettings").onclick = () => $("settings").close();
$("settings").addEventListener("close", () => $("settingsButton").focus());
$("downloadButton").onclick = () => {
  const hidden = $("downloadMenu").hidden;
  closeDownloadMenu();
  const { baseline, ordered } = comparison;
  $("downloadOptions").innerHTML = [baseline, ...ordered.filter((f) => f.id !== baseline.id)]
    .filter((file) => !file.placeholder)
    .map(
      (f) =>
        `<button data-download="${esc(f.id)}">${icon("download")} ${letter(f.id)} · ${esc(f.name)}${f.id === state.baselineId ? " (baseline)" : ""}</button>`,
    )
    .join("");
  $("downloadMenu").hidden = !hidden;
  $("downloadButton").setAttribute("aria-expanded", hidden);
};
$("downloadOptions").onclick = (e) => {
  const b = e.target.closest("[data-download]");
  if (!b) return;
  const id = b.dataset.download,
    f = byId(id),
    blob = new Blob([f.text], { type: "text/plain;charset=utf-8" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = f.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closeDownloadMenu();
  toast(`Download started: ${f.name}`);
};
document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#downloadMenu, #downloadButton")
  )
    closeDownloadMenu();
});
$("helpButton").onclick = () => $("help").showModal();
function updateThemePreference() {
  applyTheme();
  scheduleDraw();
  save();
}
$("themeSelect").innerHTML = THEME_CHOICES.map(
  (theme) => `<option value="${theme.id}">${theme.name}</option>`,
).join("");
$("themeSelect").value = state.appearance.theme;
$("themeSelect").onchange = (e) => {
  state.appearance.theme = e.target.value;
  updateThemePreference();
};
for (const radio of document.querySelectorAll('[name="appearanceMode"]')) {
  radio.checked = radio.value === state.appearance.mode;
  radio.onchange = () => {
    if (!radio.checked) return;
    state.appearance.mode = radio.value;
    updateThemePreference();
  };
}
for (const [key, id] of [
  ["syntax", "syntaxToggle"],
  ["numbers", "numbersToggle"],
  ["invisibles", "invisiblesToggle"],
  ["ignore", "ignoreToggle"],
  ["wrap", "wrapToggle"],
  ["sync", "syncToggle"],
])
  $(id).onchange = (e) => {
    state[key] = e.target.checked;
    render(key === "ignore");
  };
$("wrapButton").onclick = () => {
  state.wrap = !state.wrap;
  render(false);
};
$("syncButton").onclick = () => {
  state.sync = !state.sync;
  render(false);
};
$("themeColorGroups").innerHTML = THEME_COLOR_GROUPS.map(([group, colors]) => `
  <fieldset class="theme-color-group">
    <legend>${group}</legend>
    ${Object.entries(colors).map(([name, label]) => `
      <div class="theme-color-row" data-theme-color="${name}">
        <label for="theme-color-${name}">${label}</label>
        <div class="color-control">
          <input type="color" id="theme-color-${name}" />
          <input type="text" aria-label="${label} hex color" maxlength="7"
            spellcheck="false" autocomplete="off" title="Enter a hex color, for example #385d83" />
        </div>
      </div>`).join("")}
  </fieldset>`).join("");
for (const row of $("themeColorGroups").querySelectorAll("[data-theme-color]")) {
  const name = row.dataset.themeColor;
  const picker = row.querySelector('input[type="color"]');
  const hex = row.querySelector('input[type="text"]');
  themeColorFields.set(name, { picker, hex });
  function changeColor(value, persist) {
    const color = normalizeColor(value);
    if (!color) {
      hex.setAttribute("aria-invalid", "true");
      return;
    }
    hex.removeAttribute("aria-invalid");
    const id = document.documentElement.dataset.theme;
    const colors = state.themeColors[id] ??= {};
    colors[name] = color;
    picker.value = color;
    if (document.activeElement !== hex) hex.value = color;
    applyTheme(false);
    scheduleDraw();
    if (persist) save();
  }
  picker.oninput = (e) => changeColor(e.target.value, false);
  picker.onchange = (e) => changeColor(e.target.value, true);
  hex.oninput = (e) => changeColor(e.target.value, false);
  hex.onchange = (e) => changeColor(e.target.value, true);
  hex.onblur = () => {
    if (normalizeColor(hex.value)) hex.value = picker.value;
  };
}
$("resetThemeColors").onclick = () => {
  delete state.themeColors[document.documentElement.dataset.theme];
  updateThemePreference();
};
const textFontSelect = $("textFont");
for (const [id, name] of TEXT_FONTS)
  textFontSelect.add(new window.Option(name, id));
const customFontOption = new window.Option("Custom font", "custom");
textFontSelect.add(customFontOption);

function applyTextFont() {
  const id = state.textFont;
  const family = id === "custom"
    ? CUSTOM_TEXT_STACK
    : `"${TEXT_FONTS.get(id)}", var(--default-text-font)`;
  document.documentElement.style.setProperty("--text-font", family);
  customFontOption.disabled = !customTextFont && id !== "custom";
  customFontOption.hidden = customFontOption.disabled;
  customFontOption.textContent = customTextFont?.name ?? "Custom font";
  textFontSelect.value = id;
  $("chooseTextFont").textContent = customTextFont ? "Replace font file…" : "Choose font file…";
  if (comparison) {
    alignBlocks();
    scheduleDraw();
  }
}

function registerTextFont(font) {
  document.fonts.add(font.face);
  if (customTextFont) document.fonts.delete(customTextFont.face);
  customTextFont = font;
}

async function restoreTextFont() {
  try {
    const storedFont = await readCustomTextFont();
    if (storedFont) registerTextFont(await loadCustomTextFont(storedFont));
  } catch {}
  if (customTextFont) applyTextFont();
  else if (state.textFont === "custom") {
    state.textFont = DEFAULT_TEXT_FONT;
    $("textFontStatus").textContent = "The saved font is unavailable. Choose its file again to use it.";
    applyTextFont();
    save();
  }
  $("chooseTextFont").disabled = false;
}

textFontSelect.onchange = () => {
  state.textFont = textFontSelect.value;
  applyTextFont();
  save();
};
$("chooseTextFont").onclick = () => $("textFontFile").click();
$("textFontFile").onchange = async (event) => {
  const input = event.target;
  const file = input.files[0];
  input.value = "";
  if (!file) return;
  const status = $("textFontStatus");
  $("chooseTextFont").disabled = textFontSelect.disabled = true;
  status.textContent = "Loading font…";
  try {
    const record = { name: file.name, bytes: await file.arrayBuffer() };
    const font = await loadCustomTextFont(record);
    try {
      await saveCustomTextFont(record);
      fontForThisVisit = false;
    } catch {
      fontForThisVisit = true;
    }
    registerTextFont(font);
    state.textFont = "custom";
    applyTextFont();
    save();
    status.textContent = fontForThisVisit ? "Using this font for this visit. Browser storage is unavailable." : "";
  } catch {
    status.textContent = "Couldn’t open that font. Choose a WOFF2, WOFF, TTF, or OTF file.";
  } finally {
    $("chooseTextFont").disabled = textFontSelect.disabled = false;
  }
};
$("fontDown").onclick = () => {
  state.font = Math.max(10, state.font - 1);
  render(false);
};
$("fontUp").onclick = () => {
  state.font = Math.min(20, state.font + 1);
  render(false);
};
const exampleSelect = $("exampleSelect");
exampleSelect.innerHTML = exampleSets
  .map((example) => `<option value="${example.id}">${esc(example.label)}</option>`)
  .join("");
exampleSelect.value = "javascript";
const selectedExample = () => exampleSets.find((example) => example.id === exampleSelect.value);
exampleSelect.onchange = () => {
  $("exampleDescription").textContent = selectedExample().description;
};
exampleSelect.onchange();
$("demoButton").onclick = () => {
  const example = selectedExample();
  snapshot();
  state.files = example.files.map((f) => makeFile(f.name, f.text, f.language));
  state.baselineId = state.files[0].id;
  state.targetId = state.files[1].id;
  state.isExample = true;
  state.selected = 0;
  syntaxCache.clear();
  $("settings").close();
  render();
  toast(`${example.label} loaded · Undo restores your previous files`);
};
function openFind() {
  $("findbar").hidden = false;
  $("search").focus();
  $("search").select();
  scheduleDraw();
}
$("findButton").onclick = openFind;
$("closeFind").onclick = () => {
  $("findbar").hidden = true;
  $("search").value = "";
  search(false);
  scheduleDraw();
};
function search(navigate = true) {
  document
    .querySelectorAll(".search-hit")
    .forEach((e) => e.replaceWith(document.createTextNode(e.textContent)));
  document.querySelectorAll(".text").forEach((e) => e.normalize());
  matches = [];
  const input = $("search").value,
    query = (
      state.invisibles ? input.replace(/ /g, "·").replace(/\t/g, "⇥   ") : input
    ).toLocaleLowerCase();
  if (query)
    for (const root of document.querySelectorAll(".text")) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
        nodes = [];
      let full = "";
      while (walker.nextNode()) {
        const node = walker.currentNode;
        nodes.push({
          node,
          start: full.length,
          end: full.length + node.textContent.length,
        });
        full += node.textContent;
      }
      const lower = full.toLocaleLowerCase(),
        hits = [];
      let at = 0,
        pos;
      while ((pos = lower.indexOf(query, at)) !== -1) {
        const index = matches.length;
        matches.push([]);
        hits.push({ start: pos, end: pos + query.length, index });
        at = pos + query.length;
      }
      for (const { node, start, end } of nodes) {
        const overlaps = hits.filter((h) => h.start < end && h.end > start);
        if (!overlaps.length) continue;
        const text = node.textContent,
          frag = document.createDocumentFragment();
        let cursor = 0;
        for (const hit of overlaps) {
          const lo = Math.max(start, hit.start) - start,
            hi = Math.min(end, hit.end) - start;
          frag.append(text.slice(cursor, lo));
          const mark = document.createElement("mark");
          mark.className = "search-hit";
          mark.textContent = text.slice(lo, hi);
          frag.append(mark);
          matches[hit.index].push(mark);
          cursor = hi;
        }
        frag.append(text.slice(cursor));
        node.replaceWith(frag);
      }
    }
  matchIndex = matches.length ? 0 : -1;
  $("searchCount").textContent = input
    ? matches.length
      ? `${matches.length} matches`
      : "No matches"
    : "";
  if (navigate && matches.length) goMatch(0);
}
function goMatch(delta) {
  if (!matches.length) return;
  matchIndex = (matchIndex + delta + matches.length) % matches.length;
  matches.forEach((group, i) =>
    group.forEach((el) => el.classList.toggle("current", i === matchIndex)),
  );
  const mark = matches[matchIndex][0],
    v = mark.closest(".code-viewport"),
    card = mark.closest(".pane-card");
  scrollLocked = true;
  v.scrollTop +=
    mark.getBoundingClientRect().top - v.getBoundingClientRect().top - 70;
  v.scrollLeft +=
    mark.getBoundingClientRect().left - v.getBoundingClientRect().left - 80;
  const scroll = $("comparisonScroll");
  scroll.scrollLeft +=
    card.getBoundingClientRect().left - scroll.getBoundingClientRect().left;
  requestAnimationFrame(() => {
    scrollLocked = false;
  });
  $("searchCount").textContent = `${matchIndex + 1} of ${matches.length}`;
  scheduleDraw();
}
$("search").oninput = () => search();
$("search").onkeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    goMatch(e.shiftKey ? -1 : 1);
  }
};
$("findPrev").onclick = () => goMatch(-1);
$("findNext").onclick = () => goMatch(1);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && shelfDrag) {
    e.preventDefault();
    endShelfDrag();
    return;
  }
  if ($("settings").open) return;
  const editing =
    ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
    $("fileEditor").open ||
    $("help").open ||
    $("exampleChoice").open;
  if (e.key === "Escape") {
    closeDownloadMenu();
    if (!$("findbar").hidden) $("closeFind").click();
  }
  if (editing) return;
  if (e.metaKey || e.ctrlKey) {
    if (e.key === "f") {
      e.preventDefault();
      openFind();
    }
    if (e.key === "o") {
      e.preventDefault();
      $("openButton").click();
    }
    if (["1", "2", "3"].includes(e.key)) {
      e.preventDefault();
      state.mode = ["blocks", "fluid", "unified"][+e.key - 1];
      render(false);
    }
    if (e.key === "z" && undo.length) {
      e.preventDefault();
      $("undoButton").click();
    }
  }
  if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    selectChange(state.selected + (e.key === "ArrowUp" ? -1 : 1), true);
  }
});
const tour = createTour({
  beforeStart() {
    closeDownloadMenu();
    if ($("help").open) $("help").close();
    if ($("fileEditor").open) $("fileEditor").close();
    if ($("exampleChoice").open) $("exampleChoice").close();
  },
  onFinish(reason) {
    if (reason === "completed" && state.isExample) {
      $("exampleChoice").showModal();
      $("keepExampleButton").focus();
    }
  },
  getSteps: () => [
    {
      selector: "#fileShelf",
      title: "Your files, together",
      description:
        "Open or drop two, three, or four text files. Every loaded file gets its own pane. Drag a handle to reorder files, or click a file name to edit its text.",
    },
    {
      selector: "#baselineSelect",
      title: "Choose the reference file",
      description:
        "The baseline is the reference used to calculate every other file’s differences. Its card and column marker identify that role. Changing the baseline does not edit any file.",
    },
    {
      selector: "#comparisonScroll",
      title: "Read the text differences",
      description:
        "Colored backgrounds on text lines mark additions (green), deletions (red), and edits (blue). Uncolored text matches the baseline, subject to Ignore whitespace. These text colors are separate from the baseline and merge-target selection markers.",
    },
    {
      selector: '.pane-card.is-target [data-pane-action="target"]',
      title: "Choose a merge target",
      description:
        "The bullseye selects the other file used by the copy controls. A frame, tinted header, filled bullseye, and Merge target badge identify it. Selecting this file does not change its text; it cannot also be the baseline.",
    },
    {
      selector: ".mode-switch",
      title: "Choose how to read",
      description:
        "Blocks aligns corresponding regions. Fluid keeps the files’ natural flow and connects matching regions with curves. Unified shows baseline deletions and each file’s additions. All loaded files remain visible.",
    },
    {
      selector: ".merge-controls",
      title: "Copy one changed region",
      description: `Select a changed region, then choose a file in Merge with. With ${letter(state.baselineId)} as baseline and ${letter(state.targetId)} as merge target, Copy to baseline copies ${letter(state.targetId)} into ${letter(state.baselineId)}; Copy from baseline copies ${letter(state.baselineId)} into ${letter(state.targetId)}. Undo restores the previous contents.`,
    },
    {
      selector: ".status-end",
      title: "Keep the view comfortable",
      description:
        "The chain links scrolling across panes. The lines with a bent arrow wrap long lines to fit a pane. A filled shortcut is enabled. Both controls are also available under Settings → General.",
    },
    {
      selector: "#settingsButton",
      title: "Make the workbench yours",
      description:
        "Settings → General has reading controls like line numbers and wrapping. In Appearance, set Light, Dark, or Auto and choose a theme. Open Edit Theme to customize the palette. Your choices stay in this browser.",
    },
    {
      selector: ".header-support",
      title: "Help me make more tools",
      description:
        "I’ve put a lot of time into building Ferge. If you’ve found it helpful, consider supporting my work through these Ko-fi or Buy Me a Coffee links. Donations help me make more tools like this available. Support is always optional—thank you for using Ferge!",
    },
  ],
});
$("startTour").onclick = () => tour.start();
$("keepExampleButton").onclick = () => $("exampleChoice").close();
$("clearExampleButton").onclick = () => {
  $("exampleChoice").close();
  clearWorkspace();
  $("openButton").focus();
};
new ResizeObserver(() => {
  alignBlocks();
  scheduleDraw();
}).observe($("comparisonGrid"));
document.fonts?.addEventListener("loadingdone", () => {
  alignBlocks();
  scheduleDraw();
});
applyTextFont();
render();
restoreTextFont();
tour.maybeStart();
