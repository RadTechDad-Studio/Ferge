# Ferge handoff

This file supplies project context for a new chat. It is a snapshot, not evidence that the local Mac folder has been inspected or that every environment can access the cloud files.

## Current state

- Product name: **Ferge**. Browser title: **Ferge — The File Merger**.
- Version selected by the user: **v1.0**, displayed beside the Ferge name; package metadata is **1.0.0**. The imported 2.3.0 value was not user-approved. This does not imply a published release.
- The header subtitle is **The File Merger**, replacing “Text comparison” at the user’s request. The version and subtitle share the same 10px, normal-weight, muted typography rule. The stylesheet URL includes a cache key so older cached CSS does not leave the version at the inherited large brand size.
- Latest application commit in the original cloud checkout: `92df751` — "Add an optional Ko-fi support link in Help". A downloaded ZIP does not include that Git history.
- The user wants to continue in a local project folder. Their registered Mac project is **Web Dev - Ferge**, at `/Users/darrell/Developer/GitHub/RadTechDad/Ferge`.
- The original chat executes in a separate Linux cloud workspace. Its checkout is `/workspace/sites/kaleidoscope`; this old directory name is historical. The latest source bundle is `/workspace/ferge-source.zip` and contains a `ferge/` top-level folder.
- The Mac import has been verified: source, tests, package files, workflow, and documentation are directly in the project root. This is a portable source copy with no `.git` directory. A local HTTP preview runs at http://localhost:8000 when its server process is active.
- Do not push anything to GitHub. This has been the user's explicit, repeated instruction. They clarified that source **and the existing hosted preview** may be updated.

## Approved direction

Ferge stays an SPA. A Rust + Slint desktop rewrite was discussed and abandoned.

### Selected icon concept

- The user selected **Patch (#15)** for now: a navy document outline with a clipped upper-right corner and three rounded horizontal code lines, red at the top, green in the middle, and blue at the bottom.
- The selected image is saved at `docs/branding/ferge-patch-concept.png`. It was generated with the built-in imagegen tool as a visual concept; the finished vector reconstruction is now applied to the application header and favicon.
- Intended line colors come from the Paper theme in `dist/themes.js`: deletion red `#b25d53`, addition green `#35804d`, and edit blue `#467fb4`. Use these exact values when producing a final vector asset; the generated raster is a visual reference.
- A clean vector reconstruction and high-resolution exports are saved in `docs/branding/patch/`, with an asset guide and macOS export script. Five SVG masters cover color, black, white, color on a white rounded tile, and black on a white rounded tile. Each has directly rendered 1024-, 2048-, and 4096-pixel PNGs (15 PNGs total). The vector palette uses the exact Paper theme values above; transparent versions and white-tile versions are included. The color and black/white tile renders were visually inspected, and PNG dimensions/alpha and SVG structure were verified.
- `dist/icon.svg` is a copy of the color-on-white-tile master, used by both the header and favicon. The white tile keeps the fixed brand palette readable across all eight themes. Header image dimensions retain the original 32px desktop / 27px narrow-window sizing. Asset URLs include cache keys to refresh the previous icon and stylesheet. The approved small version label remains beside the name.
- Icon integration was visually checked in an actual browser with Paper and Ink; the DOM integration suite passed. The favicon references the same local SVG as the header.
- This selection supersedes the earlier folded-paper F, merging-arrow, and interlocking F explorations as the current branding direction.

The approved design is **Workbench 01** from a grayscale layout study: files above, tools together, comparison taking most of the screen. The original screenshot-inspired macOS look was rejected. Unrequested profiles, teams, history pages, and dashboard navigation were also rejected.

The user clarified that "four files maximum" means **up to four visible comparison panes at once**, not four loaded sources with only one selected pair shown. This is implemented.

## Implemented features

### Comparison and file roles

- All 2–4 loaded documents have their own panes.
- Every comparison pane follows the shelf order, including the baseline. The selected baseline is the reference for each other document. A/B/C/D labels reflect positions on the shelf, and the copy arrows follow the relative positions of the two selected files.
- Shared change regions combine overlapping baseline changes from all documents.
- **Blocks** aligns corresponding regions with gaps; **Fluid** preserves natural document flow; **Unified** keeps the baseline visible and interleaves old/new text in each other pane.
- Colored curves connect corresponding change regions in neighboring panes. Their colors refer to those neighboring contents. Text-difference backgrounds refer to the baseline.
- Green = additions; red = deletions; blue = modified text; uncolored text matches the baseline subject to Ignore whitespace. Unified represents edits as red old text plus green replacement text.
- A merge target is a separate non-baseline file chosen using the bullseye, Merge with selector, or pane interaction. Role selection alone does not modify text.
- Merge target cues include an outline, tinted header, filled bullseye, role badge, and selected file-card styling.
- Copy to baseline copies the selected target region into the baseline; Copy from baseline does the reverse. Undo restores previous files/contents.
- At the user’s request, **Download file** replaces patch export. It lists every loaded file, with the current baseline first and labeled, and downloads that file’s complete current UTF-8 contents with its filename. Downloading does not change documents, baseline, or merge target. Empty files, Unicode, CRLF, and missing final newlines are preserved. The unused patch-generation helper and its unit tests remain in `diff.js`; there is no patch export in the UI.

### File handling and reading

- File picker, multi-file drag/drop, clipboard fallback editor, direct text editing, removal, and new text.
- **Settings → General → Try an example** offers six independent sets: 2-file Invitation and C++; 3-file Weekend plans and Python; 4-file Soup recipe and the original JavaScript demo. Each option shows its file count and a short description. Selection alone does not touch documents. **Load example** snapshots the current files/roles, loads fresh file IDs with the first as baseline and second as target, clears stale syntax cache, and preserves display preferences; Undo restores the prior comparison. Everyday-text sets explicitly use Plain text, while code sets use automatic syntax detection. The original JavaScript files still load on the first visit, and the original `demoFiles` and earlier fixtures remain available for tests. The post-tour keep/clear copy now refers to "this example" so it works with every set. App, demo-module, and stylesheet cache keys were updated.
- When at least two files are loaded, the shelf shows six-dot handles for drag reordering. Drop onto any part of another shelf card to move to that position; only the gaps between cards are split between destinations. Following the user's CodePen reference, a floating card follows the pointer while a faded ghost stays at its original position, and a thin dotted outline marks the destination instead of the old insertion bar. Shelf and pane order stay unchanged until release. Escape, pointer cancellation, capture loss, or releasing outside the shelf cancels without a move; temporary drag elements are cleaned up. The preview is inert, hidden from assistive technology, and cannot intercept pointer input. A focused handle also moves its file with Left or Right. Reordering keeps baseline and merge target by file ID and is persisted and undoable. Internal reorder drags and external file imports use separate paths. App and stylesheet cache keys were updated for this feedback change.
- A fifth file is rejected without silently truncating input. At least two panes stay visible, but zero or one files may be loaded while starting a comparison. **Clear all** on the shelf closes all files and leaves two empty drop panes with **Choose file** buttons. Closing either of the last two files leaves an empty pane instead of being blocked. Clearing/closing is undoable and preserves display preferences.
- Choose file buttons use `--baseline-soft` / `--merge-soft` backgrounds matching their pane headers, corresponding role borders, and readable `--text` labels. They follow theme/custom selection colors and role changes. Their light and dark appearances were visually checked in Paper and Ink; computed button fills matched the header fills exactly.
- Empty drop areas fill the entire pane body with a uniform 16px inset on every side. The `is-placeholder` pane class scopes full-height flex layout and removes the text viewport’s extra right padding; loaded-file layout is unchanged. The equal 16px gaps were measured in an actual browser for both panes.
- Unused panes have a persisted `placeholder: true` marker and blank contents, distinct from real empty text files. Imports and new text fill unused panes before appending. Placeholders do not count as loaded files or appear in downloads; merging into one creates a real `Untitled.txt` file. Clearing is saved with `isExample: false`, so the example does not return on reload. Layout alignment, connectors, region navigation, and linked scrolling skip absent text segments in placeholders.
- Inputs are UTF-8 text, limited to 1 MB each; image, PDF/Office, and binary formats are excluded.
- Syntax highlighting supports 32 selectable languages, file-name/shebang/content detection, independent overrides, and full-document multiline tokens.
- Automatic highlighting is skipped above 200 KB, with a manual-language override available. Very large dissimilar replacements use coarser diff regions to bound memory.
- Search works across panes and syntax-token boundaries.
- Line numbers, invisible characters, ignore whitespace, wrapping, font controls, and linked scrolling.
- **Settings → General → Text font** applies to the comparison panes and text editor. Presets are JetBrains Mono (default), Fira Code, Cascadia Code, and Source Code Pro. Older preset selections fall back to JetBrains Mono and saved custom fonts carry over. A local WOFF2, WOFF, TTF, or OTF file can be added or replaced. One custom file is stored per browser origin. When font storage fails, the imported font is available for the current visit.
- Scroll-link and wrap icons are deliberately in the bottom-right status bar. They were briefly moved due to the hosting overlay, then restored at the user's explicit request. Both are also available under Settings → General.

### Themes, colors, and onboarding

- Eight themes each have their own light and dark palettes: **Paper, Glacier, Linen, Orchard, Ink, Midnight, Forest, Dusk**. Each theme keeps its original palette and adds a counterpart.
- The **Settings** gear in the toolbar opens a modal with **General** and **Appearance** in a vertical left sidebar and the selected panel on the right. Panels can scroll in short windows. Up/Down and Home/End select tabs from the keyboard. Escape or Close returns focus to the toolbar button.
- Appearance puts the **Light**, **Dark**, and **Auto** mode controls above the theme dropdown. Auto follows the device and switches between the selected theme’s own palettes. Older settings, including the previous grouped themes, migrate to the theme that owns the active palette. Mode and previously saved role color overrides carry over.
- The user observed that Ink and Midnight look similar, but requested two additional light themes rather than a redesign of those dark themes.
- Theme palettes coordinate interface, accents, syntax, text differences, and baseline and merge-target markers. Role tints and badge contrast are calculated from the current palette.
- Settings → General has the reading controls and example loader. Appearance has a collapsed **Edit Theme** panel and the theme dropdown stands on its own. The disclosure matches the palette group headings, with a triangle on the left and a divider on the right. The editor offers pickers and hex fields for the active palette’s colors, including Baseline and Merge target under File markers. Overrides are saved separately for each light and dark palette. **Reset palette** restores the current palette’s built-in colors. Legacy per-palette role colors carry over, and older global role colors migrate to each palette.
- Help explicitly separates text differences, baseline markers, and merge-target markers, with A/B examples of copy direction.
- A nine-step first-visit spotlight tour covers files, baseline, text differences, merge target, layout modes, copy controls, reading shortcuts, settings, and support. At the user's request, the final **Help me make more tools** step highlights `.header-support` and explains the time invested in Ferge, invites donations from users who found it helpful, and says support is optional and helps make more tools available. It has Back/Next/Skip/Finish, Escape and Left/Right handling, focus management, and replay from Help. Finishing while the unedited example is loaded opens a separate **Keep example / Start with empty panes** dialog. The tour itself never edits documents; only explicitly choosing empty panes clears the example, with Undo available. Skip keeps current files and does not prompt; replay on user files does not prompt. Escape dismisses the choice without clearing. The existing `ferge-tour-v1` completion key is retained so previous completion/skipping does not trigger another automatic tour; the new step can be seen by replaying from Help. This tour addition does not approve the separate later-visit donation reminder proposal.

### Privacy and support

- The baseline selector and per-pane change counts identify the comparison reference. Above the panes, the comparison hint names the current baseline letter and follows shelf reordering. As before, compact layouts hide this hint.
- The status says **Saved in browser**, with a tooltip and Help copy explaining that imported files on disk are not updated automatically. The download menu also explains that downloading saves current contents with the filename.
- Runtime processing and saved sessions stay in the browser. No file uploads, server APIs, telemetry, accounts, or runtime CDN dependencies.
- The shelf omits the privacy label. Help explains local processing and browser session storage together under **Privacy and saving**.
- The Help footer retains "Private by design. No uploads or accounts."
- Help contains **Support me on Ko-fi** (`https://ko-fi.com/radtechdad`) and **Buy me a coffee** (`https://buymeacoffee.com/radtechdad`) buttons, as requested by the user. The latter account slug was supplied in their screenshot.
- At the user's request, small Ko-fi and Buy Me a Coffee links now sit directly after the logo, between two vertical dividers and before Open/Paste. Their user-supplied artwork is copied unchanged into `dist/assets/support/kofi-symbol.webp` and `bmc-logo.png`, independent of the original Desktop files. Both have accessible names and hover titles; white icon backgrounds preserve contrast in dark themes. The existing Help buttons remain available. The stylesheet cache key was updated, and header controls wrap earlier to accommodate the extra icons.
- Official Ko-fi cup artwork and Buy Me a Coffee yellow button artwork are stored in `dist/assets/support/`; the Ko-fi button adapts the official widget styling to Ferge’s blue. Provenance is recorded alongside the images.
- Both open only when clicked, in new tabs with `noopener noreferrer`. No remote widgets, fonts, images, or donation trackers are loaded at runtime.

## Release preparation

- Release feedback destination: the user prefers the future repository’s GitHub Issues page. Add the Help feedback/report-a-bug link once the repository is online and its actual URL is known. No placeholder link or repository has been created; publishing still requires explicit authorization.
- A portable v1.0 source snapshot is saved locally as `releases/ferge-v1.0-source-soft-buttons.zip` (earlier source and empty-workspace snapshots are preserved), with a companion SHA-256 checksum. It includes application source, vendored runtime, tests, package files, workflow, documentation, and branding assets under a `ferge/` root, plus a per-file hash manifest. It excludes `.git`, private hosting configuration, credentials, dependencies, and the release archive directory itself. `releases/` is ignored by Git. This snapshot is not a deployment; regenerate a fresh snapshot if source changes before publishing.

## Discussed but not approved or implemented

The user asked for an opinion before adding personal attribution or donation prompts. Do not treat the following recommendations as accepted requirements:

- A small **About Ferge** section inside Help, with a creator credit such as "Built by Darrell Dudics" or "Made with ♥ by Darrell Dudics". No final wording was chosen and no creator-credit section was added.
- A gentle, dismissible donation reminder on a later visit after useful work, such as an export, capped at once per 30 days with Not now and Don't show again.
- The recommendation was to avoid timers, blocking dialogs, or prompting after every merge. No automatic donation prompt, counters, or dismissal preferences have been implemented.

The earlier legal discussion provided general U.S. IP considerations, not a clearance opinion. No patent/trademark clearance was performed. Keep original Ferge branding and artwork; do not reintroduce copied Kaleidoscope branding/assets.

## Source map

The `dist/` directory contains the actual editable source, despite its conventional build-output name.

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Workbench structure, version label, settings, Help, dialogs, support buttons |
| `dist/style.css` | Layout, responsive styles, state cues, tour styling |
| `dist/app.js` | UI orchestration, state, imports, merging/downloads, search, settings, tour steps |
| `dist/diff.js` | Line/array diff, inline changes, patch generation |
| `dist/multidiff.js` | Baseline-centered multi-file regions, boundary mapping, regional merges, connectors |
| `dist/session.js` | File/session data, migration, limits, baseline/target selection |
| `dist/syntax.js` | Detection, full-document lexing, syntax/diff overlay rendering |
| `dist/themes.js` | Sixteen complete palettes and theme resolution |
| `dist/theme-colors.js` | Editable palette groups and migration of saved color overrides |
| `dist/text-fonts.js` | Text font presets, local font loading, and IndexedDB storage |
| `dist/selection-colors.js` | Color validation, role defaults, soft tints, contrast |
| `dist/tour.js` | First-visit tour lifecycle, positioning, keyboard/focus handling |
| `dist/demo.js` | Six example sets (2/3/4-file text and code) and earlier regression fixtures |
| `dist/vendor/highlight/` | Vendored Highlight.js 11.12.0 and BSD-3-Clause license |
| `dist/vendor/fonts/` | Four programming font faces and their SIL Open Font License notices |
| `tests/*.test.js` | Unit tests |
| `tests/dom.integration.mjs` | DOM interaction checks using jsdom |
| `.github/workflows/pages.yml` | Future Pages deployment workflow; not permission to push |

Browser storage keys:

- `ferge-workbench`: documents, role choices, layout, `appearance` (theme and mode), `themeColors` (color overrides by palette ID), `textFont` (selected font), and other preferences.
- IndexedDB `ferge-fonts`: one custom font file and its display name, stored separately from the session.
- `ferge-tour-v1`: tour completed/skipped marker.
- `kaleidoscope-comparison`: legacy session migration input. Keep migration support unless deliberately changed.

## Run and verify

```sh
npm ci
npm test
npm run test:dom
python3 -m http.server 8000 --directory dist
```

Use a supported Node.js release compatible with `package-lock.json` (`jsdom` 31.0.1 is the development dependency). The documented baseline is Node.js 22 or later. Open the local HTTP URL rather than `file://`.

Latest local checks include **54 passing unit tests** and the DOM integration suite. Appearance checks cover all sixteen palettes, mode-first control order, simulated device changes in Auto, fixed light and dark modes, legacy preference migration, and per-palette overrides and resets. Browser checks compared the disclosure styling with the Interface heading in Paper Light and verified keyboard collapse. Earlier browser checks covered a live Linen Dark color edit and reset, both Linen modes, the Appearance panel at 360 × 420 CSS pixels, and persistence of a dark palette override after reload. The existing pre-deployment source snapshot predates these settings changes.

The header support-link change passed the DOM integration suite. An actual Chrome preview verified both supplied images loaded, their correct destinations/new-tab safety attributes, both vertical dividers, and readable Paper Light/Dark rendering. Header layout checks at 360, 480, 900, 1050, 1100, and 1380 CSS pixels found no header overflow; both support links and Open/Paste stayed inside the viewport. No donation link was activated during verification.

The final support tour step passed the DOM integration suite, including nine-step progress, Back/Right navigation, optional-support copy, preserved document/settings storage, completion, and the existing example-choice flows. Chrome confirmed the spotlight surrounds the header donation group and the text/navigation render correctly. At 360 × 640 CSS pixels the popover and Finish button both fit inside the viewport; finishing retained all current pane names. The app module cache key was updated for this addition.

The example library passed 54 unit tests and the extended DOM suite. All six sets were checked for correct files/counts/language settings, all three layouts, preserved preferences, a regional merge and Undo, complete downloads, post-tour keep/clear behavior, and restoring the prior comparison after loading. Chrome verified all six options, the four original/new-text loads and Undo, then the two added code loads with automatic C++/Python detection and merge/Undo. Reload retained the three-file Python set. At 360 × 420 CSS pixels the selector fit without horizontal panel overflow and the Load button remained reachable by keyboard. Both C++ files passed `clang++ -std=c++17 -fsyntax-only`; all three Python files passed syntax compilation. Browser checks used an isolated local preview; the existing source ZIP predates this change.

The DOM suite checks the four preset names, default and alternate selection, and persistence through clearing the workspace. Browser checks exercised all four programming presets and verified the CSS font stacks in the comparison panes and editor. The local server served each WOFF2 file. The custom Source Code Pro TTF from the earlier native-picker test remained available after updating the presets.

File reorder checks cover pointer cancellation, drop placement, the keyboard shortcut, role preservation, undo, and saved order. In the browser, dragging the last example file into second place moved the matching comparison pane and kept the selected merge target on its file. Undo, keyboard reordering, and reload persistence were also verified.

The shelf destination fix passed all **54 unit tests** and the full DOM suite. A regression check clears the shelf, reloads the four-file example, and exercises all 16 source/destination combinations at three horizontal points per destination (48 checks), verifying pane order, unchanged file contents/roles, persistence, and undo. In an isolated Chrome preview, all 12 moves between distinct positions succeeded with actual pointer drags after clearing/reloading the example; Undo restored each order. Moving the baseline into second place also survived reload, with matching shelf/pane order and the merge target still on draft.js.

The ghost/outline feedback update also passed all **54 unit tests** and the full DOM suite, including the existing 48 drop-position cases. Added DOM checks cover the lift threshold (including vertical movement), preview geometry/accessibility, unchanged order/storage while hovering, destination changes and clearing when outside the shelf, Escape/pointer cancellation/capture loss, and cleanup after release. All 12 moves passed with actual Chrome pointer drags on the normal app page, with Undo between moves; a final move persisted with matching pane order after reload. A temporary inspection fixture paused release to visually inspect the in-flight source ghost, floating preview, and destination outline; computed styles confirmed source opacity 0.2 and a 1px dotted theme-accent outline. Escape cleared the paused preview. The fixture was removed afterward; it is not part of the app.

The movable baseline was verified in the browser by dragging it to the far right and switching through Blocks, Fluid, and Unified. The shelf and panes kept the same order after reload, and changing the baseline in the selector left the pane order intact. The DOM suite also covers merging and the baseline-first Download file menu with the baseline in a middle pane.

The updated header, Help support buttons, browser-saving explanation, and download menu were visually inspected in an actual browser at http://127.0.0.1:8000/. The download menu was also checked at 480px width, including closing with Escape. A real browser download of a merged baseline retained its filename (`baseline.js`) and matched the current editor contents byte for byte; the test merge was then undone. The version sits beside the name, and both official support buttons render together at the bottom of Help. The post-tour choice and empty workspace were also visually checked in an actual browser, including reload persistence, text entry into a placeholder, Blocks with a partially filled workspace, and clear/undo. Browser error logs were empty at the end of the check. Native file-picker automation timed out, so picker routing/import behavior was verified in DOM tests without a completed end-to-end native-picker import. Broad cross-browser and full-product visual QA remains outstanding.

Earlier full automated visual browser QA was blocked in the cloud environment by a failing preview relay and a sign-in gate on the privately hosted app. DOM tests do not verify layout or actual browser rendering. The user has reviewed and supplied screenshots of the hosted UI. Local visual verification is an appropriate next step, especially for onboarding positioning, narrow viewports, long/wrapped lines, and four-pane scrolling.

## Existing hosting and local migration

- Existing hosted preview: `https://kaleidoscope-fluid-compare.darrelldudics.chatgpt.site`.
- Display title: **Ferge — Text Comparison Workbench**. The old URL slug is intentionally unchanged.
- Sites project ID: `appgprj_6afed48000648191bc653bddd507abf7` (an identifier, not a credential).
- The preview is owner-private. Do not change its audience.
- The original cloud checkout has `.openai/hosting.json` and a Sites-managed source remote at `git.chatgpt-team.site`. That is not a GitHub push.
- Portable ZIPs omit `.openai/`, `.git/`, `node_modules/`, and temporary credential-handling scripts. Never copy or reconstruct source credentials from chat history.
- The Pages workflow is ready, but no GitHub repository or Pages deployment has been created for Ferge by this chat.
- Local migration is confirmed: the Mac folder contains `dist/`, `tests/`, `package.json`, `package-lock.json`, `.github/`, and the documentation directly in its root, not inside a second nested `ferge/` directory.
- If the user already copied the previous ZIP, add `AGENTS.md` and `HANDOFF.md` to that root. Do not overwrite local code changes merely to update documentation.

## Good first action in the new local chat

Read `AGENTS.md`, this handoff, and `README.md`; inspect the actual folder and Git state; confirm the import; then run the existing checks and open a local preview. Ask what the user wants to work on next rather than automatically implementing the unresolved credit/donation proposals.
