# Ferge

A browser-local workbench for comparing and merging **two, three, or four text files simultaneously**. Ferge runs as a static web app. It compares and merges your text in your browser and needs no backend or build step.

[Open Ferge](https://radtechdad-studio.github.io/Ferge/)

## Run locally

Clone the repository and serve the `dist/` directory over HTTP with Python 3:

```sh
git clone https://github.com/RadTechDad-Studio/Ferge.git
cd Ferge
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Use an HTTP server rather than double-clicking the HTML file: browser security rules restrict ES modules on `file://` URLs.

The header displays the selected **Patch** document icon and **v1.0** beside the Ferge name, with **The File Merger** underneath. The browser tab uses the same icon. Its white tile preserves the navy outline and red, green, and blue lines across all themes.

## The Workbench

Every loaded file gets its own visible pane. The first run includes four short example files so you can try the full layout immediately. **Clear all** closes them and leaves two empty drop panes. Previously saved files migrate from the earlier prototype; a cleared workspace stays empty when you return.

Choose a **baseline** from the selector above the comparison. On wider screens, the sentence above the panes identifies the current baseline by letter. Each other loaded pane shows its change count against the baseline letter. Ferge calculates differences between that file and every other loaded file. All panes, including the baseline, follow the shelf order. The A/B/C/D letters reflect each file’s position on the shelf.

- **Blocks:** corresponding regions are aligned across every pane, including gaps and wrapped lines.
- **Fluid:** each file keeps its natural text flow; curves connect corresponding regions in neighboring panes.
- **Unified:** the baseline stays visible, while every other pane interleaves baseline deletions and that file's additions.

Text highlights refer to the baseline. Connector colors describe differing contents in neighboring panes. Shared change regions are derived from all baseline comparisons, so navigating a change shows the corresponding location in every file.

Green marks additions, red marks deletions, and blue marks edits. Signs remain visible so differences do not depend on color alone.

## First-visit quick tour

A nine-step spotlight tour introduces the file shelf, baseline, text differences, merge target, layout modes, copy controls, scrolling/wrapping shortcuts, and display settings. Its final step highlights the donation icons and explains how optional support helps the creator make more tools available. It has Back, Next, Skip, and Finish controls. Escape skips the tour; Left/Right moves between steps. Keyboard focus stays in the tour until it is closed.

Completion or skipping is remembered locally under `ferge-tour-v1`, so the introduction does not repeat on later visits. Replay it at any time using **Help → Take the quick tour**. The tour does not modify files or comparison settings. After finishing with the example loaded, a separate choice offers **Keep example** or **Start with empty panes**. Only the latter clears the example, and Undo restores it. Skipping the tour keeps the current files; **Clear all** is always available on the file shelf. Replay over your own files does not offer to clear them. Browser storage must be available to remember that the tour was seen.

## Working with files

- **Open:** choose 2–4 files to replace the example/current comparison. One file is added when space is available, or replaces the selected merge file when the workbench is full.
- **Add file:** fill unused panes first, then append files, up to four loaded files total.
- **New text / Paste text:** enter a file name and content; fill an unused pane, create a new source, or explicitly replace an existing source. Browser clipboard permission is optional because the text editor is always available.
- **Drag and drop:** drop files onto the shelf to add them. Dropping 2–4 files over the initial example replaces the example. Drop a single file onto a pane to replace that file; drop multiple files onto a pane to open a new comparison.
- **Reorder files:** drag a file’s six-dot handle onto any part of another shelf card to move it to that position, along with its comparison pane. A floating copy follows the pointer, a faded ghost stays in the original position, and a thin dotted outline marks the destination. Release to move, or press Escape to cancel. You can also focus the handle and press Left or Right. Ferge saves the order in this browser and keeps the baseline and merge target on their assigned files. **Undo** restores the previous order.
- **Clear all:** close every file and leave two empty panes with drop targets and **Choose file** buttons. The dotted drop areas fill the pane bodies with an even inset on every side. Choose file buttons use their pane’s soft baseline or merge-target tint, including custom role colors. Closing either of the last two files leaves an empty pane too. Undo restores cleared or closed files and their roles; display preferences are preserved.
- Edit any file from its shelf chip or pane header. Empty panes are reused by imports and text entry, and do not count toward the four-file limit or appear in Download file. An actual empty text file is still a loaded, downloadable file. A fifth file is rejected without silently truncating the selection.

Images, PDF/Office documents, and binary formats are excluded. Files are interpreted as UTF-8 and limited to 1 MB each.

## Example library

Under **Settings → General → Try an example**, choose a set and click **Load example**:

| Files | Everyday text | Code |
| --- | --- | --- |
| 2 | Invitation: original wording and a revision | C++: a range clamp and a C++17 revision |
| 3 | Weekend plans: original, outdoor, and rainy-day versions | Python: a tag parser, cleaned input, and deduplicated tags |
| 4 | Soup recipe: original, creamy, smoky, and quick versions | JavaScript: the original four-file comparison example |

Choosing an item only updates its description. Loading replaces the current comparison, with the first file as baseline and the second as merge target. **Undo** brings back the previous files and roles. Display preferences are preserved. Every example supports the normal layouts, editing, regional merging, reordering, and full-file downloads. The first visit still starts with the original JavaScript example.

## Merging and downloading

Select a change region and choose a file in **Merge with**, or use that pane's target control. The selected merge file has an outline, a tinted header, a visible **Merge target** badge, and a filled bullseye button. The baseline has its own reference marker. The active theme palette defines both role colors and the separate text-difference colors. Choosing a merge file affects actions only; it never hides the other panes or modifies any text.

- **Copy to baseline:** replace the selected baseline region with the selected file's version.
- **Copy from baseline:** replace the selected file's region with the baseline version.
- **Undo:** restores file changes, removed/replaced files, and merges.
- **Download file:** choose any loaded file, including the baseline, and save its complete current contents with its filename. Downloads include your edits and merged changes, preserve UTF-8 text and line endings, and support empty files. Patch export has been removed.

Ferge is a multi-file comparison tool. It does not claim to perform automatic conflict resolution or a Git three-way merge.

## Syntax and display

Syntax highlighting supports 32 selectable languages. Detection uses file names, shebangs, and content. Each file has its own language override, including plain text. Multiline comments and strings remain correctly highlighted across lines.

Open **Settings** using the gear icon in the toolbar and choose **Appearance**. Choose **Light**, **Dark**, or **Auto**, then select **Paper**, **Glacier**, **Linen**, **Orchard**, **Ink**, **Midnight**, **Forest**, or **Dusk**. Each theme has its own light and dark palettes. Auto follows your device and switches between the selected theme’s two palettes. Changes apply immediately.

Expand **Edit Theme** in **Appearance** to customize the active palette’s interface, accents, file markers, text differences, or syntax highlighting. Each color has a picker and a hex field. Ferge saves edits in this browser separately for each theme’s light and dark palettes. **Reset palette** restores the active palette’s built-in colors.

Under **Settings → General**, **Text font** applies to the comparison panes and text editor. Choose JetBrains Mono (the default), Fira Code, Cascadia Code, or Source Code Pro. Ferge ships with all four fonts. Use **Choose font file…** to add your own WOFF2, WOFF, TTF, or OTF file. Ferge keeps the selected font and one custom font file in this browser. You can switch between the presets and the custom font, or replace the custom file from Settings.

The **General** tab also includes font size, line numbers, invisible characters, ignoring whitespace, linked scrolling, wrapping, and syntax coloring. The bottom-right status bar also has shortcuts for linked scrolling and line wrapping. Search works across all visible panes, including phrases spanning syntax-token boundaries.

Automatic syntax coloring is skipped above 200 KB; choosing a language manually can override that. Detection is heuristic. Large dissimilar replacements use coarser diff groups to bound memory.

Keyboard shortcuts:

| Shortcut      | Action                 |
| ------------- | ---------------------- |
| Ctrl/⌘1, 2, 3 | Blocks, Fluid, Unified |
| Ctrl/⌘F       | Find across files      |
| Ctrl/⌘O       | Open files             |
| Alt+Up / Down | Previous / next change |
| Ctrl/⌘Z       | Undo a file change     |

## Privacy

Ferge compares files and pasted text entirely in your browser. It never sends filenames, text, or edits to a server.

**Saved in browser** means your session is stored in this browser, under `ferge-workbench`. Imported files on disk are not updated automatically. Use **Download file** to save the current contents of any loaded file to disk. The app makes no file uploads or account requests. If browser storage is unavailable or full, the status indicates that the session could not be saved; the current comparison remains usable. Use **Download file** to save your files before closing.

## Support

Small **Ko-fi** and **Buy Me a Coffee** icons sit between two vertical dividers after the Ferge logo and before **Open** and **Paste text**. They link to https://ko-fi.com/radtechdad and https://buymeacoffee.com/radtechdad, with descriptive tooltips and keyboard-accessible labels. The optional quick tour ends by pointing out these links. Help retains the larger **Support me on Ko-fi** and **Buy me a coffee** buttons. All artwork is stored locally, including the user-supplied header icons. Each link opens a new tab only when clicked. Ferge loads no remote widget scripts, fonts, or donation trackers and shows no recurring donation reminders.

## GitHub Pages

The public source repository is [RadTechDad-Studio/Ferge](https://github.com/RadTechDad-Studio/Ferge). To deploy your own copy to GitHub Pages, select **GitHub Actions** as the Pages source in your repository settings, then run the **Deploy Ferge to GitHub Pages** workflow. The workflow also runs on pushes to `main`. It runs the unit and DOM tests before deploying `dist/`.

For other static hosts, publish the contents of `dist/` directly.

## Tests

```sh
npm test
```

Use Node.js 22 or later. Tests use Node's built-in runner and need no package installation. They cover source reconstruction, four-source alignment, every baseline, insertions/deletions and empty files, merge boundaries, unified rendering data, syntax detection, and session migration. Randomized alignment cases verify that no source lines are lost, duplicated, or reordered.

For the complete DOM interaction checks, install the development test dependency and run:

```sh
npm ci
npm run test:dom
```

These checks cover four visible panes, every layout, baseline changes, merge/undo, search across syntax spans, per-file syntax controls, file editing, 2/3/4-file transitions, drops, image rejection, full-file downloads (including the baseline, merged contents, Unicode, CRLF, empty files, and missing final newlines), theme editing and per-palette resets, onboarding navigation/replay and its optional example choice, clear-all and closing with undo, placeholder imports/merges, and persistence. They do not substitute for visual rendering checks. The branding, Help support buttons, saving explanation, and download menu have also been checked in an actual local browser, including the download menu at 480px width. A real merged-baseline download was verified against its current editor contents. The empty workspace, post-tour example choice, clearing/undo, and reload persistence have also been checked in the browser. File-picker automation timed out, so that specific native-picker flow was covered by DOM interaction checks rather than an end-to-end browser import. Broader cross-browser visual QA remains outstanding.

## Third-party software

Highlight.js 11.12.0 is vendored locally under its BSD-3-Clause license. Its copyright and license are preserved at `dist/vendor/highlight/LICENSE`.

The bundled regular WOFF2 faces use the SIL Open Font License 1.1. Each font's original notice is included alongside it in `dist/vendor/fonts/`.

| Font | Upstream release |
| --- | --- |
| JetBrains Mono | [2.304](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304) |
| Fira Code | [6.2](https://github.com/tonsky/FiraCode/releases/tag/6.2) |
| Cascadia Code | [2407.24](https://github.com/microsoft/cascadia-code/releases/tag/v2407.24) |
| Source Code Pro | [2.042 upright](https://github.com/adobe-fonts/source-code-pro/releases/tag/2.042R-u%2F1.062R-i%2F1.026R-vf) |
