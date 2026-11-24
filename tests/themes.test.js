import { test } from "node:test";
import assert from "node:assert/strict";
import { THEMES, THEME_CHOICES, getTheme, normalizeTheme, restoreAppearance, resolveAppearance } from "../dist/themes.js";
import { selectionPalette, contrast } from "../dist/selection-colors.js";
import { THEME_COLOR_GROUPS } from "../dist/theme-colors.js";
test("Each of the eight themes has an independent light and dark palette", () => {
  assert.deepEqual(THEME_CHOICES.map(({ name }) => name), [
    "Paper", "Glacier", "Linen", "Orchard", "Ink", "Midnight", "Forest", "Dusk",
  ]);
  assert.equal(THEMES.length, 16);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 16);
  assert.equal(new Set(THEMES.map((t) => t.colors.surface)).size, 16);
  for (const choice of THEME_CHOICES) {
    for (const mode of ["light", "dark"]) {
      const palette = resolveAppearance({ theme: choice.id, mode });
      assert.equal(palette.name, choice.name);
      assert.equal(palette.scheme, mode);
    }
  }
  const editableKeys = THEME_COLOR_GROUPS.flatMap(([, colors]) => Object.keys(colors)).sort();
  for (const theme of THEMES) {
    assert.deepEqual(Object.keys({ ...theme.colors, ...theme.selection }).sort(), editableKeys);
    assert.ok(["light", "dark"].includes(theme.scheme));
  }
});
test("System appearance resolves predictably and invalid saved names fall back", () => {
  assert.equal(getTheme("system", false).id, "light");
  assert.equal(getTheme("system", true).id, "dark");
  const custom = { light: "orchard", dark: "forest" };
  assert.equal(getTheme("system", false, custom).id, "orchard");
  assert.equal(getTheme("system", true, custom).id, "forest");
  assert.equal(getTheme("linen", true, custom).id, "linen");
  const invalid = { light: "forest", dark: "missing" };
  assert.equal(getTheme("system", false, invalid).id, "light");
  assert.equal(getTheme("system", true, invalid).id, "dark");
  assert.equal(getTheme("forest").scheme, "dark");
  assert.equal(getTheme("glacier").scheme, "light");
  for (const id of [null, "missing", "url(x)", {}]) {
    assert.equal(normalizeTheme(id), "light");
    assert.equal(getTheme(id).id, "light");
  }
});
test("Every palette maintains readable body, diff text, and primary buttons", () => {
  for (const t of THEMES) {
    for (const bg of [
      "surface",
      "subtle",
      "added-bg",
      "deleted-bg",
      "changed-bg",
    ])
      assert.ok(
        contrast(t.colors.text, t.colors[bg]) >= 7,
        `${t.name} ${bg} body contrast`,
      );
    assert.ok(
      contrast(t.colors.accent, t.colors["accent-on"]) >= 4.5,
      `${t.name} primary button contrast`,
    );
  }
});
test("Appearance migration keeps the active legacy palette and appearance mode", () => {
  const previous = { theme: "system", systemThemes: { light: "glacier", dark: "forest" } };
  assert.deepEqual(restoreAppearance(), { theme: "paper", mode: "light" });
  assert.deepEqual(restoreAppearance({ theme: "dusk" }), { theme: "dusk", mode: "dark" });
  const onDark = restoreAppearance(previous, true);
  assert.deepEqual(onDark, { theme: "forest", mode: "auto" });
  assert.equal(resolveAppearance(onDark, true).id, "forest");
  assert.equal(resolveAppearance(onDark, false).id, "forest-light");
  const onLight = restoreAppearance(previous, false);
  assert.equal(resolveAppearance(onLight, false).id, "glacier");
  assert.equal(resolveAppearance(onLight, true).id, "glacier-dark");
  assert.deepEqual(restoreAppearance({ appearance: onLight }, true), onLight);
  assert.deepEqual(restoreAppearance({ appearance: { family: "paper", mode: "dark" } }), {
    theme: "ink", mode: "dark",
  });
  const formerPair = { appearance: { family: "linen", mode: "auto" } };
  assert.deepEqual(restoreAppearance(formerPair), { theme: "linen", mode: "auto" });
  assert.deepEqual(restoreAppearance(formerPair, true), { theme: "dusk", mode: "auto" });
});
test("Selection defaults follow each palette and custom colors override them independently", () => {
  for (const t of THEMES) {
    const defaults = selectionPalette(t.id);
    assert.equal(defaults.baseline.color, t.selection.baseline);
    assert.equal(defaults.merge.color, t.selection.merge);
    const custom = selectionPalette(t.id, {
      baselineColor: "#00aa88",
      mergeColor: "#ffa000",
    });
    assert.equal(custom.baseline.color, "#00aa88");
    assert.equal(custom.merge.color, "#ffa000");
    assert.ok(contrast(custom.baseline.color, custom.baseline.on) >= 4.5);
    assert.notEqual(custom.baseline.soft, custom.baseline.color);
    const one = selectionPalette(t.id, { baselineColor: "#00aa88" });
    assert.equal(one.merge.color, t.selection.merge);
  }
});
