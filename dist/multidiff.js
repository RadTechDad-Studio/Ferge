import { diffLines, diffArrays } from "./diff.js";
const split = (s) => (s === "" ? [] : s.split("\n"));
const sameLines = (a, b, ignore) =>
  a.length === b.length &&
  a.every(
    (s, i) =>
      (ignore ? s.replace(/\s+/g, "") : s) ===
      (ignore ? b[i].replace(/\s+/g, "") : b[i]),
  );
export function mapBoundary(pair, position, edge = "before") {
  let value = 0;
  for (const g of pair.groups) {
    if (g.aStart > position) break;
    if (!g.aLines.length && g.aStart === position) {
      if (edge === "before") return g.bStart;
      value = g.bStart + g.bLines.length;
      continue;
    }
    const end = g.aStart + g.aLines.length;
    if (position < end) {
      const distance = position - g.aStart;
      return (
        g.bStart +
        (g.type === "equal" ? distance : Math.min(distance, g.bLines.length))
      );
    }
    value = g.bStart + g.bLines.length;
  }
  return value;
}
export function buildComparison(files, baselineId, ignoreWhitespace = false) {
  const baseline = files.find((f) => f.id === baselineId) || files[0];
  if (!baseline) throw new Error("A baseline file is required.");
  const ordered = [...files],
    comparedFiles = ordered.filter((f) => f.id !== baseline.id),
    baseLines = split(baseline.text),
    pairs = new Map();
  const events = [];
  for (const file of comparedFiles) {
    const pair = diffLines(baseline.text, file.text, ignoreWhitespace);
    pairs.set(file.id, pair);
    for (const g of pair.changes)
      events.push({ start: g.aStart, end: g.aStart + g.aLines.length });
  }
  events.sort((a, b) => a.start - b.start || a.end - b.end);
  const regions = [];
  for (const event of events) {
    const last = regions.at(-1);
    if (last && event.start <= last.end)
      last.end = Math.max(last.end, event.end);
    else regions.push({ ...event });
  }
  const partitions = [];
  let cursor = 0;
  for (const r of regions) {
    if (r.start > cursor)
      partitions.push({ start: cursor, end: r.start, changed: false });
    partitions.push({ ...r, changed: true });
    cursor = r.end;
  }
  if (cursor < baseLines.length)
    partitions.push({ start: cursor, end: baseLines.length, changed: false });
  const groups = [];
  let changeIndex = 0;
  for (const region of partitions) {
    const baseSlice = baseLines.slice(region.start, region.end),
      segments = new Map();
    const baseRows = baseSlice.map((text, i) => ({
      text,
      line: region.start + i,
      type: "equal",
      sourceId: baseline.id,
    }));
    for (const file of comparedFiles) {
      const pair = pairs.get(file.id),
        start = mapBoundary(
          pair,
          region.start,
          region.changed ? "before" : "after",
        ),
        end = mapBoundary(
          pair,
          region.end,
          region.changed ? "after" : "before",
        );
      const lines = pair.B.slice(start, end),
        local = diffArrays(baseSlice, lines, ignoreWhitespace);
      const rows = [],
        unified = [];
      for (const g of local.groups) {
        if (g.type === "equal") {
          g.bLines.forEach((text, i) => {
            const row = {
              text,
              line: start + g.bStart + i,
              type: "equal",
              sourceId: file.id,
            };
            rows.push(row);
            unified.push(row);
          });
        } else {
          g.aLines.forEach((text, i) => {
            const rowIndex = g.aStart + i,
              old = baseRows[rowIndex];
            if (old) {
              const type = g.type === "deleted" ? "deleted" : "changed";
              if (old.type === "equal" || type === "changed")
                Object.assign(old, { type, other: g.bLines[i] });
            }
            unified.push({
              text,
              line: region.start + rowIndex,
              type: "deleted",
              sourceId: baseline.id,
            });
          });
          g.bLines.forEach((text, i) => {
            rows.push({
              text,
              line: start + g.bStart + i,
              type: g.type,
              other: g.aLines[i],
              sourceId: file.id,
            });
            unified.push({
              text,
              line: start + g.bStart + i,
              type: "added",
              sourceId: file.id,
            });
          });
        }
      }
      const type = sameLines(baseSlice, lines, ignoreWhitespace)
        ? "equal"
        : !baseSlice.length
          ? "added"
          : !lines.length
            ? "deleted"
            : "changed";
      segments.set(file.id, {
        fileId: file.id,
        start,
        end,
        lines,
        rows,
        unified,
        type,
      });
    }
    const baseType = region.changed
      ? !baseSlice.length
        ? "added"
        : comparedFiles.every((f) => segments.get(f.id).type === "deleted")
          ? "deleted"
          : "changed"
      : "equal";
    segments.set(baseline.id, {
      fileId: baseline.id,
      start: region.start,
      end: region.end,
      lines: baseSlice,
      rows: baseRows,
      unified: baseRows,
      type: baseType,
    });
    groups.push({
      id: "g" + groups.length,
      baseStart: region.start,
      baseEnd: region.end,
      index: region.changed ? changeIndex++ : -1,
      segments,
    });
  }
  return {
    baseline,
    ordered,
    pairs,
    groups,
    changes: groups.filter((g) => g.index >= 0),
    ignoreWhitespace,
  };
}
export function mergeRegion(
  comparison,
  groupIndex,
  targetId,
  toBaseline = false,
) {
  const group = comparison.groups[groupIndex];
  if (!group || group.index < 0)
    throw new Error("Choose a changed region to merge.");
  const sourceId = toBaseline ? targetId : comparison.baseline.id,
    destinationId = toBaseline ? comparison.baseline.id : targetId;
  if (
    sourceId === destinationId ||
    !group.segments.has(sourceId) ||
    !group.segments.has(destinationId)
  )
    throw new Error("Choose a comparison file.");
  const source = group.segments.get(sourceId),
    destination = group.segments.get(destinationId);
  const file = comparison.ordered.find((f) => f.id === destinationId),
    lines = split(file.text);
  lines.splice(
    destination.start,
    destination.end - destination.start,
    ...source.lines,
  );
  return { id: destinationId, text: lines.join("\n") };
}
export function connectorType(left, right, ignore = false) {
  if (sameLines(left.lines, right.lines, ignore)) return "equal";
  return !left.lines.length
    ? "added"
    : !right.lines.length
      ? "deleted"
      : "changed";
}
