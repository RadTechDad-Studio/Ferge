import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeColor,
  selectionPalette,
  contrast,
  SELECTION_DEFAULTS,
} from "../dist/selection-colors.js";
import { restoreThemeColors } from "../dist/theme-colors.js";
test("Legacy role colors migrate to each palette and scoped resets survive reload", () => {
  const saved = { baselineColor: "#aab", mergeColor: "#217744" };
  const migrated = restoreThemeColors(saved);
  assert.deepEqual(Object.keys(migrated), Object.keys(SELECTION_DEFAULTS));
  assert.deepEqual(migrated.forest, { baseline: "#aaaabb", merge: "#217744" });
  assert.deepEqual(restoreThemeColors({ themeSelectionColors: { forest: { mergeColor: "#aab" } } }), {
    forest: { merge: "#aaaabb" },
  });
  delete migrated.forest;
  migrated.light.merge = "#ff0000";
  migrated.light.surface = "#fafafa";
  const restored = restoreThemeColors({ ...saved, themeColors: migrated });
  assert.deepEqual(restored, migrated);
  assert.equal(restored.forest, undefined);
  assert.equal(restored.dark.merge, "#217744");
  assert.deepEqual(restoreThemeColors({ themeColors: { light: { surface: "url(x)", unknown: "#fff" } } }), {});
});
test("Color input normalizes hex and rejects non-color data", () => {
  assert.equal(normalizeColor(" #FA0 "), "#ffaa00");
  assert.equal(normalizeColor("#AABBCC"), "#aabbcc");
  for (const value of [
    null,
    3,
    "blue",
    "#12345",
    "#abc; color:red",
    "var(--accent)",
  ])
    assert.equal(normalizeColor(value), null);
});
test("Defaults follow the theme while independent custom choices remain stable", () => {
  assert.equal(
    selectionPalette("light").baseline.color,
    SELECTION_DEFAULTS.light.baseline,
  );
  assert.equal(
    selectionPalette("dark").merge.color,
    SELECTION_DEFAULTS.dark.merge,
  );
  for (const theme of ["light", "dark"]) {
    const p = selectionPalette(theme, {
      baselineColor: "#009988",
      mergeColor: "#f80",
    });
    assert.equal(p.baseline.color, "#009988");
    assert.equal(p.merge.color, "#ff8800");
    assert.notEqual(p.baseline.soft, p.baseline.color);
  }
  assert.equal(
    selectionPalette("light", { baselineColor: "#f00" }).merge.color,
    SELECTION_DEFAULTS.light.merge,
  );
});
test("Badge text retains at least AA contrast across arbitrary custom colors", () => {
  const samples = [
    "#000000",
    "#ffffff",
    "#777777",
    "#ffcc00",
    "#007777",
    "#4422ee",
    "#ee22aa",
    "#00ff00",
    "#ff0000",
    "#7655ae",
  ];
  for (let r = 0; r <= 255; r += 51)
    for (let g = 0; g <= 255; g += 51)
      for (let b = 0; b <= 255; b += 51)
        samples.push(
          "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""),
        );
  for (const theme of ["light", "dark"])
    for (const color of samples) {
      const p = selectionPalette(theme, {
        baselineColor: color,
        mergeColor: color,
      });
      for (const role of ["baseline", "merge"])
        assert.ok(contrast(p[role].color, p[role].on) >= 4.5, color);
    }
});
test("Invalid persisted colors fall back to safe theme defaults", () => {
  const p = selectionPalette("dark", {
    baselineColor: "url(javascript:x)",
    mergeColor: [],
  });
  assert.equal(p.baseline.color, SELECTION_DEFAULTS.dark.baseline);
  assert.equal(p.merge.color, SELECTION_DEFAULTS.dark.merge);
});
