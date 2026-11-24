# Ferge Patch icon

Clean vector reconstruction of the selected Patch (#15) concept. The original generated reference remains at `../ferge-patch-concept.png`. These exports preserve its document outline, folded corner, and three staggered rounded code lines, with flat, exact colors rather than the raster reference's texture.

## Files

Editable, resolution-independent masters are in `svg/`. Matching PNGs are in `png/`, each at **1024 × 1024**, **2048 × 2048**, and **4096 × 4096** pixels.

| Filename stem | Appearance |
| --- | --- |
| `ferge-patch-color` | Navy outline with red, green, and blue lines; transparent background and document interior |
| `ferge-patch-black` | Solid black artwork on transparency |
| `ferge-patch-white` | Solid white artwork on transparency, for dark backgrounds |
| `ferge-patch-color-tile` | Color artwork on a white rounded tile with a light-gray border |
| `ferge-patch-black-white-tile` | Black artwork on a white rounded tile with a black border |

The tile versions are transparent outside the rounded tile. The SVGs contain paths and rounded rectangles only: no embedded raster image, fonts, scripts, or external dependencies.

## Palette

| Element | Color |
| --- | --- |
| Document outline | `#19334d` |
| Top line: deletions | `#b25d53` |
| Middle line: additions | `#35804d` |
| Bottom line: edits | `#467fb4` |
| Color tile border | `#cbd3de` |

The red, green, and blue values match the Paper theme in `dist/themes.js`. These brand assets use that fixed palette; they do not change with application themes.

## Regenerate PNGs

On macOS, run from this folder:

```sh
swift export-icons.swift
```

The script uses AppKit with an sRGB canvas to render each SVG directly at every export size, preserving transparency. PNG pixel values were checked against the palette above, along with export dimensions and transparency. No upscaling of the generated concept image is involved.

The application header and favicon use `dist/icon.svg`, copied from `svg/ferge-patch-color-tile.svg`. The white tile keeps the fixed palette visible in light and dark themes.
