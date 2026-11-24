export const MAX_FILES = 4;
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  "file-" + Math.random().toString(36).slice(2);
export function makeFile(name, text = "", language = "auto") {
  return {
    id: uid(),
    name: String(name || "Untitled.txt"),
    text: String(text),
    language: String(language || "auto"),
  };
}
export function makePlaceholder() {
  return { ...makeFile("Empty pane"), placeholder: true };
}
export function clearFiles(s) {
  s.files = [makePlaceholder(), makePlaceholder()];
  s.baselineId = s.files[0].id;
  s.targetId = s.files[1].id;
  repairSelection(s);
}
export function initSession(saved, defaults) {
  const files = Array.isArray(saved?.files)
    ? saved.files
        .filter(
          (f) => f && typeof f.text === "string" && typeof f.name === "string",
        )
        .slice(0, MAX_FILES)
        .map((f) => ({
          ...makeFile(f.name, f.text, f.language),
          id: typeof f.id === "string" ? f.id : uid(),
          ...(f.placeholder === true && f.text === "" ? { placeholder: true } : {}),
        }))
    : [];
  // Repair duplicate identities in persisted data, and migrate the original two-source format.
  const seen = new Set();
  for (const f of files) {
    if (seen.has(f.id)) f.id = uid();
    seen.add(f.id);
  }
  if (!files.length)
    files.push(
      makeFile(saved?.nameA || "scene.py", saved?.a ?? defaults.a),
      makeFile(saved?.nameB || "scene.py", saved?.b ?? defaults.b),
    );
  while (files.length < 2) files.push(makeFile("Untitled.txt"));
  const activeA = files.some((f) => f.id === saved?.activeA)
    ? saved.activeA
    : files[0].id;
  const activeB = files.some((f) => f.id === saved?.activeB && f.id !== activeA)
    ? saved.activeB
    : files.find((f) => f.id !== activeA).id;
  const baselineId = files.some((f) => f.id === saved?.baselineId)
    ? saved.baselineId
    : activeA;
  const targetId = files.some(
    (f) => f.id === saved?.targetId && f.id !== baselineId,
  )
    ? saved.targetId
    : files.find((f) => f.id !== baselineId).id;
  return { files, activeA, activeB, baselineId, targetId };
}
export const activeFile = (s, side) =>
  s.files.find((f) => f.id === s["active" + side]);
export function chooseFile(s, id, side) {
  if (!s.files.some((f) => f.id === id)) return;
  const other = side === "A" ? "B" : "A";
  if (s["active" + other] === id) s["active" + other] = s["active" + side];
  s["active" + side] = id;
}
export function removeFile(s, id) {
  const index = s.files.findIndex((f) => f.id === id);
  if (index < 0 || s.files[index].placeholder) return false;
  if (s.files.length <= 2) s.files[index] = { ...makePlaceholder(), id };
  else s.files.splice(index, 1);
  if (!s.files.some((f) => f.id === s.activeA))
    s.activeA = s.files.find((f) => f.id !== s.activeB).id;
  if (!s.files.some((f) => f.id === s.activeB))
    s.activeB = s.files.find((f) => f.id !== s.activeA).id;
  repairSelection(s);
  return true;
}
export function addFiles(s, files) {
  const empty = s.files.filter((f) => f.placeholder);
  if (files.length > MAX_FILES - s.files.length + empty.length)
    throw new Error(
      "A comparison can hold up to 4 text files. Remove a file before adding another.",
    );
  const added = files.map((f, i) => {
    const file = makeFile(f.name, f.text, f.language);
    if (empty[i]) {
      file.id = empty[i].id;
      s.files[s.files.indexOf(empty[i])] = file;
    } else s.files.push(file);
    return file;
  });
  return added;
}
export function snapshotSession(s) {
  return {
    files: s.files.map((f) => ({ ...f })),
    activeA: s.activeA,
    activeB: s.activeB,
    baselineId: s.baselineId,
    targetId: s.targetId,
  };
}
export function validateTextFiles(files, remaining = MAX_FILES) {
  if (files.length && remaining === 0)
    throw new Error(
      "The shelf already holds 4 files. Remove a file before adding another.",
    );
  if (files.length > remaining)
    throw new Error(
      `Choose up to ${remaining} text file${remaining === 1 ? "" : "s"} for this comparison.`,
    );
  for (const f of files) {
    if (f.size > 1000000)
      throw new Error("Please use text files smaller than 1 MB each.");
    if (
      /^(image|audio|video)\//.test(f.type || "") ||
      /\.(png|jpe?g|gif|webp|heic|bmp|tiff?|svgz?|pdf|zip|docx?|xlsx?|pptx?|woff2?|ttf|exe|dmg)$/i.test(
        f.name,
      )
    )
      throw new Error("Only text and source-code files are supported.");
  }
}

export function repairSelection(s) {
  if (!s.files.some((f) => f.id === s.baselineId)) s.baselineId = s.files[0].id;
  if (!s.files.some((f) => f.id === s.targetId && f.id !== s.baselineId))
    s.targetId = s.files.find((f) => f.id !== s.baselineId).id;
  s.activeA = s.baselineId;
  s.activeB = s.targetId;
}
export function setBaseline(s, id) {
  if (!s.files.some((f) => f.id === id)) return;
  s.baselineId = id;
  repairSelection(s);
}
export function setTarget(s, id) {
  if (id !== s.baselineId && s.files.some((f) => f.id === id)) {
    s.targetId = id;
    s.activeB = id;
  }
}
