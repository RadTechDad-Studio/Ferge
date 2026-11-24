// Line comparison with bounded memory. Very large replacements remain a single hunk.
export function diffLines(a, b, ignoreWhitespace = false) {
  const A = a === "" ? [] : a.split("\n"),
    B = b === "" ? [] : b.split("\n");
  return { ...diffArrays(A, B, ignoreWhitespace), sourceA: a, sourceB: b };
}
export function diffArrays(A, B, ignoreWhitespace = false) {
  const key = (s) => (ignoreWhitespace ? s.replace(/\s+/g, "") : s);
  const ak = A.map(key),
    bk = B.map(key);
  let prefix = 0,
    suffix = 0;
  while (prefix < A.length && prefix < B.length && ak[prefix] === bk[prefix])
    prefix++;
  while (
    suffix < A.length - prefix &&
    suffix < B.length - prefix &&
    ak[A.length - 1 - suffix] === bk[B.length - 1 - suffix]
  )
    suffix++;
  const n = A.length - prefix - suffix,
    m = B.length - prefix - suffix;
  const ops = [];
  for (let i = 0; i < prefix; i++) ops.push("equal");
  if (n * m <= 4000000) {
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] =
          ak[prefix + i] === bk[prefix + j]
            ? dp[i + 1][j + 1] + 1
            : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0,
      j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && ak[prefix + i] === bk[prefix + j]) {
        ops.push("equal");
        i++;
        j++;
      } else if (i < n && (j === m || dp[i + 1][j] >= dp[i][j + 1])) {
        ops.push("deleted");
        i++;
      } else {
        ops.push("added");
        j++;
      }
    }
  } else {
    for (let i = 0; i < n; i++) ops.push("deleted");
    for (let i = 0; i < m; i++) ops.push("added");
  }
  for (let i = 0; i < suffix; i++) ops.push("equal");
  const raw = [];
  let ai = 0,
    bi = 0;
  for (const type of ops) {
    let g = raw.at(-1);
    if (!g || g.type !== type) {
      g = { type, aStart: ai, bStart: bi, aLines: [], bLines: [] };
      raw.push(g);
    }
    if (type !== "added") g.aLines.push(A[ai++]);
    if (type !== "deleted") g.bLines.push(B[bi++]);
  }
  const groups = [];
  for (let i = 0; i < raw.length; i++) {
    const g = raw[i],
      h = raw[i + 1];
    if (g.type === "deleted" && h?.type === "added") {
      const aa = g.aLines,
        bb = h.bLines;
      // Similar lines become blue edits; unrelated replacements stay red / green.
      let x = 0,
        y = 0;
      const pairs = [];
      if (aa.length * bb.length < 40000) {
        const scores = aa.map((s) => bb.map((t) => similarity(s, t)));
        const d = Array.from(
          { length: aa.length + 1 },
          () => new Float32Array(bb.length + 1),
        );
        for (let k = aa.length - 1; k >= 0; k--)
          for (let l = bb.length - 1; l >= 0; l--)
            d[k][l] = Math.max(
              d[k + 1][l],
              d[k][l + 1],
              scores[k][l] >= 0.48 ? d[k + 1][l + 1] + scores[k][l] : 0,
            );
        while (x < aa.length && y < bb.length) {
          if (
            scores[x][y] >= 0.48 &&
            Math.abs(d[x][y] - d[x + 1][y + 1] - scores[x][y]) < 0.001
          ) {
            pairs.push([x++, y++]);
          } else if (d[x + 1][y] >= d[x][y + 1]) x++;
          else y++;
        }
      }
      x = 0;
      y = 0;
      for (const [px, py] of [...pairs, [aa.length, bb.length]]) {
        if (px > x)
          groups.push({
            type: "deleted",
            aStart: g.aStart + x,
            bStart: g.bStart + y,
            aLines: aa.slice(x, px),
            bLines: [],
          });
        if (py > y)
          groups.push({
            type: "added",
            aStart: g.aStart + px,
            bStart: g.bStart + y,
            aLines: [],
            bLines: bb.slice(y, py),
          });
        if (px < aa.length)
          groups.push({
            type: "changed",
            aStart: g.aStart + px,
            bStart: g.bStart + py,
            aLines: [aa[px]],
            bLines: [bb[py]],
          });
        x = px + 1;
        y = py + 1;
      }
      i++;
    } else groups.push(g);
  }
  const merged = [];
  for (const g of groups) {
    let p = merged.at(-1);
    if (
      p &&
      p.type === g.type &&
      p.aStart + p.aLines.length === g.aStart &&
      p.bStart + p.bLines.length === g.bStart
    ) {
      p.aLines.push(...g.aLines);
      p.bLines.push(...g.bLines);
    } else merged.push({ ...g });
  }
  let change = 0;
  for (const g of merged) g.index = g.type === "equal" ? -1 : change++;
  return {
    groups: merged,
    changes: merged.filter((g) => g.index >= 0),
    A,
    B,
    sourceA: A.join("\n"),
    sourceB: B.join("\n"),
  };
}
function similarity(a, b) {
  if (a === b) return 1;
  if (!a.trim() || !b.trim()) return 0;
  const tokens = (s) =>
    new Set(s.trim().match(/[a-zA-Z_]+|\d+|[^\s\w]/g) || []);
  const x = tokens(a),
    y = tokens(b);
  let same = 0;
  for (const t of x) if (y.has(t)) same++;
  const overlap = (2 * same) / (x.size + y.size);
  let pre = 0;
  const aa = a.trim(),
    bb = b.trim();
  while (pre < aa.length && aa[pre] === bb[pre]) pre++;
  return overlap * 0.75 + (pre / Math.max(aa.length, bb.length)) * 0.25;
}
export function inlineParts(text, other) {
  let start = 0,
    end = 0;
  while (
    start < text.length &&
    start < other.length &&
    text[start] === other[start]
  )
    start++;
  while (
    end < text.length - start &&
    end < other.length - start &&
    text[text.length - 1 - end] === other[other.length - 1 - end]
  )
    end++;
  return [
    text.slice(0, start),
    text.slice(start, text.length - end),
    end ? text.slice(-end) : "",
  ];
}
export function makePatch(result, nameA, nameB) {
  const a = result.sourceA,
    b = result.sourceB;
  const aa = a.match(/[^\n]*\n|[^\n]+$/g) || [],
    bb = b.match(/[^\n]*\n|[^\n]+$/g) || [];
  const ids = new Map();
  const encode = (lines) =>
    lines
      .map((s) => {
        if (!ids.has(s)) ids.set(s, String(ids.size));
        return ids.get(s);
      })
      .join("\n");
  const r = diffLines(encode(aa), encode(bb));
  let out = `--- a/${nameA}\n+++ b/${nameB}\n`;
  if (a === b) return out;
  out += `@@ -${aa.length ? 1 : 0},${aa.length} +${bb.length ? 1 : 0},${bb.length} @@\n`;
  const write = (prefix, s) =>
    prefix + s + (s.endsWith("\n") ? "" : "\n\\ No newline at end of file\n");
  for (const g of r.groups) {
    if (g.type === "equal") {
      g.aLines.forEach((_, i) => {
        out += write(" ", aa[g.aStart + i]);
      });
    } else {
      g.aLines.forEach((_, i) => {
        out += write("-", aa[g.aStart + i]);
      });
      g.bLines.forEach((_, i) => {
        out += write("+", bb[g.bStart + i]);
      });
    }
  }
  return out;
}
