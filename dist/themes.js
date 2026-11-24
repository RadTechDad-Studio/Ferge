const paper = {
  bg: "#f6f7f9",
  surface: "#ffffff",
  subtle: "#f8f9fb",
  text: "#242d39",
  muted: "#7b8592",
  border: "#e3e7ed",
  "border-strong": "#cbd3de",
  accent: "#385d83",
  "accent-soft": "#edf3fa",
  "accent-text": "#244e7b",
  "accent-on": "#ffffff",
  "added-bg": "#eaf5ed",
  added: "#35804d",
  "deleted-bg": "#fbeeed",
  deleted: "#b25d53",
  "changed-bg": "#edf3fb",
  changed: "#467fb4",
  "shadow-color": "#142235",
  "file-letter-bg": "#edf0f4",
  "file-letter-text": "#667384",
  "number-text": "#9ba4af",
  "syntax-keyword": "#965ab2",
  "syntax-string": "#56804b",
  "syntax-number": "#b77636",
  "syntax-comment": "#8b929b",
  "syntax-title": "#3979b1",
  "syntax-built-in": "#347e87",
  "syntax-property": "#986c36",
  "syntax-tag": "#a55e64",
  "syntax-variable": "#915e7c",
};
const ink = {
  ...paper,
  bg: "#20242c",
  surface: "#252a34",
  subtle: "#292f39",
  text: "#dce2eb",
  muted: "#8f9baa",
  border: "#343d49",
  "border-strong": "#4c596b",
  accent: "#729bc7",
  "accent-soft": "#2b3a4d",
  "accent-text": "#a9c8ec",
  "accent-on": "#142337",
  "added-bg": "#243c32",
  added: "#75b68a",
  "deleted-bg": "#463031",
  deleted: "#cd8d84",
  "changed-bg": "#2a3b50",
  changed: "#83a9d3",
  "shadow-color": "#000000",
  "file-letter-bg": "#394454",
  "file-letter-text": "#adbdcf",
  "number-text": "#8c9caf",
  "syntax-keyword": "#c5a2e2",
  "syntax-string": "#a5c68d",
  "syntax-number": "#d7af7d",
  "syntax-comment": "#99a5b4",
  "syntax-title": "#97bfe7",
  "syntax-built-in": "#89bebf",
  "syntax-property": "#cfb790",
  "syntax-tag": "#d09d9e",
  "syntax-variable": "#c3a9c1",
};
const originalPalettes = [
  {
    id: "light",
    name: "Paper",
    scheme: "light",
    colors: paper,
    selection: { baseline: "#385d83", merge: "#7655ae" },
  },
  {
    id: "glacier",
    name: "Glacier",
    scheme: "light",
    colors: {
      ...paper,
      bg: "#edf4fb",
      surface: "#fbfdff",
      subtle: "#f1f6fc",
      text: "#1e354c",
      muted: "#5b7188",
      border: "#d6e2ef",
      "border-strong": "#b1c7dc",
      accent: "#28669d",
      "accent-soft": "#e2effa",
      "accent-text": "#245b89",
      "added-bg": "#e7f3eb",
      added: "#2e7746",
      "deleted-bg": "#f9e9eb",
      deleted: "#a74b57",
      "changed-bg": "#e4eefb",
      changed: "#3b73aa",
      "file-letter-bg": "#e2edf7",
      "file-letter-text": "#4e6c88",
      "number-text": "#70879e",
      "syntax-keyword": "#77509e",
      "syntax-string": "#447841",
      "syntax-number": "#98622e",
      "syntax-comment": "#6a7e90",
      "syntax-title": "#276b9f",
      "syntax-built-in": "#267a80",
      "syntax-property": "#8d6035",
      "syntax-tag": "#a24e67",
      "syntax-variable": "#7e5a91",
    },
    selection: { baseline: "#28669d", merge: "#7955a2" },
  },
  {
    id: "linen",
    name: "Linen",
    scheme: "light",
    colors: {
      ...paper,
      bg: "#f5efe5",
      surface: "#fffaf0",
      subtle: "#f8f1e6",
      text: "#3d3028",
      muted: "#7b6655",
      border: "#e3d6c5",
      "border-strong": "#c7ad94",
      accent: "#9a5637",
      "accent-soft": "#f3e3d4",
      "accent-text": "#87482f",
      "added-bg": "#ebf2e3",
      added: "#477a3d",
      "deleted-bg": "#f9e6df",
      deleted: "#a15043",
      "changed-bg": "#e7edf4",
      changed: "#4a7095",
      "file-letter-bg": "#eee2cf",
      "file-letter-text": "#7a614b",
      "number-text": "#9b8b78",
      "syntax-keyword": "#88508c",
      "syntax-string": "#56763c",
      "syntax-number": "#93602f",
      "syntax-comment": "#807365",
      "syntax-title": "#3d6e8b",
      "syntax-built-in": "#357875",
      "syntax-property": "#8f6333",
      "syntax-tag": "#a04f57",
      "syntax-variable": "#815f8d",
    },
    selection: { baseline: "#9a5637", merge: "#727a3e" },
  },
  {
    id: "orchard",
    name: "Orchard",
    scheme: "light",
    colors: {
      ...paper,
      bg: "#edf4eb",
      surface: "#f9fcf7",
      subtle: "#f0f6ec",
      text: "#293d2d",
      muted: "#627760",
      border: "#d5e1d0",
      "border-strong": "#adbf9f",
      accent: "#3e704e",
      "accent-soft": "#e0eddc",
      "accent-text": "#315f40",
      "added-bg": "#e2f0dd",
      added: "#37713e",
      "deleted-bg": "#f8e8e3",
      deleted: "#a45145",
      "changed-bg": "#e7eef9",
      changed: "#426c9c",
      "file-letter-bg": "#e0ead8",
      "file-letter-text": "#586d4d",
      "number-text": "#83957b",
      "syntax-keyword": "#7e5298",
      "syntax-string": "#48733a",
      "syntax-number": "#996133",
      "syntax-comment": "#6e8168",
      "syntax-title": "#366e8f",
      "syntax-built-in": "#2f7a72",
      "syntax-property": "#8b6639",
      "syntax-tag": "#9e5654",
      "syntax-variable": "#7b5d8c",
    },
    selection: { baseline: "#3e704e", merge: "#a16d3b" },
  },
  {
    id: "dark",
    name: "Ink",
    scheme: "dark",
    colors: ink,
    selection: { baseline: "#729bc7", merge: "#b8a0e5" },
  },
  {
    id: "midnight",
    name: "Midnight",
    scheme: "dark",
    colors: {
      ...ink,
      bg: "#0b1423",
      surface: "#101e31",
      subtle: "#15263c",
      text: "#dbe8f5",
      muted: "#9eb2c9",
      border: "#24374e",
      "border-strong": "#39516c",
      accent: "#62c8e5",
      "accent-soft": "#173849",
      "accent-text": "#9ee1f1",
      "accent-on": "#08252c",
      "added-bg": "#14372f",
      added: "#81d2a2",
      "deleted-bg": "#3a2532",
      deleted: "#ed9b9b",
      "changed-bg": "#17334e",
      changed: "#88bff5",
      "file-letter-bg": "#223b54",
      "file-letter-text": "#b1cce5",
      "number-text": "#819ab5",
      "syntax-keyword": "#c5a8f0",
      "syntax-string": "#9fd7b5",
      "syntax-number": "#edc08f",
      "syntax-comment": "#91a8c1",
      "syntax-title": "#90c8f0",
      "syntax-built-in": "#8ed8d9",
      "syntax-property": "#d4c49c",
      "syntax-tag": "#eca9bd",
      "syntax-variable": "#c6b6e7",
    },
    selection: { baseline: "#62c8e5", merge: "#b6a0ed" },
  },
  {
    id: "forest",
    name: "Forest",
    scheme: "dark",
    colors: {
      ...ink,
      bg: "#101b18",
      surface: "#17251f",
      subtle: "#1c2f26",
      text: "#dfece2",
      muted: "#a4b9aa",
      border: "#2f4437",
      "border-strong": "#46634f",
      accent: "#a3cca8",
      "accent-soft": "#283f30",
      "accent-text": "#c0dfc2",
      "accent-on": "#10271e",
      "added-bg": "#233f2c",
      added: "#9bd3a4",
      "deleted-bg": "#422c2b",
      deleted: "#e6aaa1",
      "changed-bg": "#203b41",
      changed: "#a2cbdc",
      "file-letter-bg": "#314b39",
      "file-letter-text": "#bbd4c0",
      "number-text": "#8ba994",
      "syntax-keyword": "#d6b4e6",
      "syntax-string": "#c1d39b",
      "syntax-number": "#f2c38b",
      "syntax-comment": "#96b49e",
      "syntax-title": "#a6d7cd",
      "syntax-built-in": "#b2d6c2",
      "syntax-property": "#dfc69a",
      "syntax-tag": "#edb5ab",
      "syntax-variable": "#d4bad4",
    },
    selection: { baseline: "#a3cca8", merge: "#e0bb84" },
  },
  {
    id: "dusk",
    name: "Dusk",
    scheme: "dark",
    colors: {
      ...ink,
      bg: "#211a29",
      surface: "#2a2134",
      subtle: "#33283e",
      text: "#eee3ef",
      muted: "#c0a9c2",
      border: "#4a3b56",
      "border-strong": "#695271",
      accent: "#e3a7c9",
      "accent-soft": "#4b3148",
      "accent-text": "#f1c3dc",
      "accent-on": "#301727",
      "added-bg": "#293d37",
      added: "#a2d0ad",
      "deleted-bg": "#4d2c3c",
      deleted: "#f0acb7",
      "changed-bg": "#313650",
      changed: "#adbff1",
      "file-letter-bg": "#4b3958",
      "file-letter-text": "#dfc7e0",
      "number-text": "#b196ba",
      "syntax-keyword": "#d4b2f0",
      "syntax-string": "#b9d3b0",
      "syntax-number": "#edc09a",
      "syntax-comment": "#b39db9",
      "syntax-title": "#bac7f3",
      "syntax-built-in": "#a9cbd6",
      "syntax-property": "#e4c2ad",
      "syntax-tag": "#efb1cb",
      "syntax-variable": "#d9b4db",
    },
    selection: { baseline: "#e3a7c9", merge: "#adbbf1" },
  },
];
// Each theme keeps its original palette and adds a companion in the other mode.
function variant(id, name, scheme, colors, merge) {
  return {
    id, name, scheme,
    colors: { ...(scheme === "dark" ? ink : paper), ...colors },
    selection: { baseline: colors.accent, merge },
  };
}

export const THEMES = [
  ...originalPalettes,
  variant("paper-dark", "Paper", "dark", {
    bg: "#1d2229", surface: "#232a33", subtle: "#2a333e", text: "#e6edf4", muted: "#a3afbd",
    border: "#394552", "border-strong": "#536477", accent: "#9abadd",
    "accent-soft": "#303e4e", "accent-text": "#c2dbf4", "accent-on": "#1b2838",
    "syntax-keyword": "#bea9dc", "syntax-string": "#acd2b1", "syntax-title": "#a9ccea",
  }, "#baa7dd"),
  variant("glacier-dark", "Glacier", "dark", {
    bg: "#15252f", surface: "#1c303d", subtle: "#243c49", text: "#e4f2fa", muted: "#a2bfcd",
    border: "#355060", "border-strong": "#506f81", accent: "#84c6f4",
    "accent-soft": "#284a63", "accent-text": "#bce4ff", "accent-on": "#122a3b",
    "syntax-keyword": "#c6b6ec", "syntax-string": "#ade2c2", "syntax-title": "#a6d9fb",
  }, "#bfa4e1"),
  variant("linen-dark", "Linen", "dark", {
    bg: "#241c17", surface: "#30251e", subtle: "#3b2e25", text: "#f5e9da", muted: "#c6af9b",
    border: "#504033", "border-strong": "#765c48", accent: "#e8a78b",
    "accent-soft": "#51362b", "accent-text": "#f8c5ad", "accent-on": "#321e15",
    "syntax-keyword": "#dbb1dd", "syntax-string": "#bfd396", "syntax-number": "#e8bd8c",
  }, "#b9c384"),
  variant("orchard-dark", "Orchard", "dark", {
    bg: "#1c241b", surface: "#252e23", subtle: "#2e382a", text: "#eaf1e3", muted: "#acbda2",
    border: "#414e3a", "border-strong": "#607454", accent: "#a2c9a3",
    "accent-soft": "#344d36", "accent-text": "#c8e3c1", "accent-on": "#1a2a1a",
    "syntax-keyword": "#cdb2e4", "syntax-string": "#c1da9b", "syntax-number": "#e8b98a",
  }, "#d6a674"),
  variant("ink-light", "Ink", "light", {
    bg: "#e9ebf0", surface: "#f4f5f8", subtle: "#edf0f5", text: "#20242e", muted: "#5c6477",
    border: "#d4d9e3", "border-strong": "#afb8c9", accent: "#435a83",
    "accent-soft": "#dfe6f3", "accent-text": "#354b73",
    "syntax-keyword": "#6d4c94", "syntax-string": "#426850", "syntax-title": "#365787",
  }, "#6c5199"),
  variant("midnight-light", "Midnight", "light", {
    bg: "#e6edf7", surface: "#f3f7fd", subtle: "#eaf0fa", text: "#15263f", muted: "#536983",
    border: "#cfddec", "border-strong": "#a8bed7", accent: "#176582",
    "accent-soft": "#dceef5", "accent-text": "#175774",
    "syntax-keyword": "#674b9b", "syntax-string": "#327159", "syntax-title": "#235b94",
  }, "#6555a5"),
  variant("forest-light", "Forest", "light", {
    bg: "#e3eee7", surface: "#f0f8f3", subtle: "#e9f3ec", text: "#1c3027", muted: "#506c5d",
    border: "#cbdfd1", "border-strong": "#a3bea9", accent: "#305e47",
    "accent-soft": "#dfede0", "accent-text": "#29513c",
    "syntax-keyword": "#73538f", "syntax-string": "#4a6b31", "syntax-built-in": "#2b6b5f",
  }, "#8b5e31"),
  variant("dusk-light", "Dusk", "light", {
    bg: "#f0e7f2", surface: "#faf4fb", subtle: "#f5edf7", text: "#342438", muted: "#755b79",
    border: "#e3d4e6", "border-strong": "#bfa7c6", accent: "#834464",
    "accent-soft": "#f4e0eb", "accent-text": "#793d5b",
    "syntax-keyword": "#78508b", "syntax-string": "#4c754d", "syntax-title": "#4a5c98",
  }, "#56619a"),
];

export const THEME_CHOICES = originalPalettes.map(({ id, name, scheme }) => {
  const theme = id === "light" ? "paper" : id === "dark" ? "ink" : id;
  return {
    id: theme,
    name,
    light: scheme === "light" ? id : theme + "-light",
    dark: scheme === "dark" ? id : theme + "-dark",
  };
});

const legacyDarkPalettes = { paper: "dark", glacier: "midnight", linen: "dusk", orchard: "forest" };
const appearanceScheme = (mode, systemDark) =>
  mode === "auto" ? (systemDark ? "dark" : "light") : mode;
const themeOfPalette = (palette) =>
  THEME_CHOICES.find((theme) => theme[palette.scheme] === palette.id).id;

export function normalizeTheme(value) {
  return value === "system" || THEMES.some((t) => t.id === value)
    ? value
    : "light";
}
function normalizeSystemTheme(value, scheme) {
  return THEMES.some((theme) => theme.id === value && theme.scheme === scheme)
    ? value
    : scheme;
}
export function getTheme(value, systemDark = false, systemThemes) {
  const id = normalizeTheme(value);
  const scheme = systemDark ? "dark" : "light";
  const active = id === "system"
    ? normalizeSystemTheme(systemThemes?.[scheme], scheme)
    : id;
  return THEMES.find((theme) => theme.id === active);
}

export function restoreAppearance(saved, systemDark = false) {
  const appearance = saved?.appearance;
  if (appearance) {
    const mode = ["light", "dark", "auto"].includes(appearance.mode) ? appearance.mode : "light";
    if (appearance.theme) {
      const theme = THEME_CHOICES.find((choice) => choice.id === appearance.theme)?.id ?? "paper";
      return { theme, mode };
    }
    // Keep the palette that the former cross-theme pairing was displaying.
    const scheme = appearanceScheme(mode, systemDark);
    const legacyFamily = Object.hasOwn(legacyDarkPalettes, appearance.family)
      ? appearance.family
      : "paper";
    const paletteId = scheme === "dark"
      ? legacyDarkPalettes[legacyFamily]
      : legacyFamily === "paper" ? "light" : legacyFamily;
    return { theme: themeOfPalette(getTheme(paletteId)), mode };
  }

  const palette = getTheme(saved?.theme, systemDark, saved?.systemThemes);
  return {
    theme: themeOfPalette(palette),
    mode: saved?.theme === "system" ? "auto" : palette.scheme,
  };
}

export function resolveAppearance({ theme, mode }, systemDark = false) {
  const selected = THEME_CHOICES.find((choice) => choice.id === theme) ?? THEME_CHOICES[0];
  return getTheme(selected[appearanceScheme(mode, systemDark)]);
}
