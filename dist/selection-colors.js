import { THEMES, getTheme } from "./themes.js?v=1.0-theme-editor";
export const SELECTION_DEFAULTS = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme.selection]),
);
export function normalizeColor(value) {
  if (typeof value !== "string") return null;
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex))
    return (
      "#" +
      hex
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
    );
  return null;
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function luminance(hex) {
  return rgb(hex)
    .map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function blend(a, b, weight) {
  const x = rgb(a),
    y = rgb(b);
  return (
    "#" +
    x
      .map((v, i) =>
        Math.round(v * weight + y[i] * (1 - weight))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function selectionPalette(theme, preferences = {}, surfaceColor) {
  const resolved = getTheme(theme),
    dark = resolved.scheme === "dark",
    defaults = resolved.selection,
    surface = surfaceColor ?? resolved.colors.surface;
  const role = (name, custom) => {
    const color = normalizeColor(custom) || defaults[name];
    return {
      color,
      soft: blend(color, surface, dark ? 0.2 : 0.1),
      on:
        contrast(color, "#ffffff") >= contrast(color, "#000000")
          ? "#ffffff"
          : "#000000",
      border: blend(color, surface, dark ? 0.7 : 0.55),
    };
  };
  return {
    baseline: role("baseline", preferences.baselineColor),
    merge: role("merge", preferences.mergeColor),
  };
}
