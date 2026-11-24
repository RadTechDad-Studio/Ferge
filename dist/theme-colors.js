import { THEMES } from "./themes.js?v=1.0-theme-editor";
import { normalizeColor } from "./selection-colors.js?v=1.0-theme-editor";

export const THEME_COLOR_GROUPS = [
  ["Interface", {
    bg: "Page background",
    surface: "Panel background",
    subtle: "Subtle background",
    text: "Text",
    muted: "Secondary text",
    border: "Border",
    "border-strong": "Strong border",
    "shadow-color": "Shadow",
  }],
  ["Accents", {
    accent: "Accent",
    "accent-soft": "Accent background",
    "accent-text": "Accent text",
    "accent-on": "Text on solid accent",
  }],
  ["File markers", {
    baseline: "Baseline",
    merge: "Merge target",
    "file-letter-bg": "File letter background",
    "file-letter-text": "File letter text",
    "number-text": "Line numbers",
  }],
  ["Text differences", {
    added: "Addition marker",
    "added-bg": "Addition background",
    deleted: "Deletion marker",
    "deleted-bg": "Deletion background",
    changed: "Edit marker",
    "changed-bg": "Edit background",
  }],
  ["Syntax highlighting", {
    "syntax-keyword": "Keywords",
    "syntax-string": "Strings",
    "syntax-number": "Numbers",
    "syntax-comment": "Comments",
    "syntax-title": "Names",
    "syntax-built-in": "Built-ins",
    "syntax-property": "Properties",
    "syntax-tag": "Tags",
    "syntax-variable": "Variables",
  }],
];

export function restoreThemeColors(saved) {
  const palettes = {};
  for (const theme of THEMES) {
    const overrides = {};
    const defaults = { ...theme.colors, ...theme.selection };
    const legacy = saved?.themeSelectionColors ? saved.themeSelectionColors[theme.id] : saved;
    const stored = saved?.themeColors
      ? saved.themeColors[theme.id]
      : { baseline: legacy?.baselineColor, merge: legacy?.mergeColor };
    for (const [key, fallback] of Object.entries(defaults)) {
      const color = normalizeColor(stored?.[key]);
      if (color && color !== fallback) overrides[key] = color;
    }
    if (Object.keys(overrides).length) palettes[theme.id] = overrides;
  }
  return palettes;
}
