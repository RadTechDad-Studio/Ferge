import hljs from "./vendor/highlight/highlight.js";
export const languages = [
  ["plaintext", "Plain text"],
  ["bash", "Shell / Bash"],
  ["c", "C"],
  ["cpp", "C++"],
  ["csharp", "C#"],
  ["css", "CSS"],
  ["diff", "Diff / Patch"],
  ["go", "Go"],
  ["graphql", "GraphQL"],
  ["ini", "INI / TOML"],
  ["java", "Java"],
  ["javascript", "JavaScript"],
  ["json", "JSON"],
  ["kotlin", "Kotlin"],
  ["less", "Less"],
  ["lua", "Lua"],
  ["makefile", "Makefile"],
  ["markdown", "Markdown"],
  ["objectivec", "Objective-C"],
  ["perl", "Perl"],
  ["php", "PHP"],
  ["python", "Python"],
  ["r", "R"],
  ["ruby", "Ruby"],
  ["rust", "Rust"],
  ["scss", "SCSS"],
  ["sql", "SQL"],
  ["swift", "Swift"],
  ["typescript", "TypeScript"],
  ["wasm", "WebAssembly"],
  ["xml", "HTML / XML"],
  ["yaml", "YAML"],
];
const extensions = {
  py: "python",
  pyw: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  jsonc: "json",
  html: "xml",
  htm: "xml",
  xml: "xml",
  svg: "xml",
  vue: "xml",
  svelte: "xml",
  plist: "xml",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  markdown: "markdown",
  yaml: "yaml",
  yml: "yaml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  swift: "swift",
  sql: "sql",
  toml: "ini",
  ini: "ini",
  conf: "ini",
  r: "r",
  lua: "lua",
  pl: "perl",
  pm: "perl",
  patch: "diff",
  diff: "diff",
  graphql: "graphql",
  gql: "graphql",
  wat: "wasm",
  m: "objectivec",
  mm: "objectivec",
};
const candidates = [
  "python",
  "javascript",
  "typescript",
  "json",
  "xml",
  "css",
  "markdown",
  "yaml",
  "bash",
  "sql",
  "go",
  "rust",
  "java",
  "cpp",
  "csharp",
  "swift",
  "ruby",
  "php",
  "ini",
];
export const languageLabel = (id) =>
  languages.find((l) => l[0] === id)?.[1] || "Plain text";
export function detectLanguage(text, name = "", override = "auto") {
  if (override !== "auto")
    return {
      language: hljs.getLanguage(override) ? override : "plaintext",
      source: "manual",
    };
  const basename = name.toLowerCase().split(/[\\/]/).at(-1);
  const ext = basename.includes(".") ? basename.split(".").at(-1) : "";
  if (extensions[ext]) return { language: extensions[ext], source: "filename" };
  if (/^(makefile|gnumakefile)$/.test(basename))
    return { language: "makefile", source: "filename" };
  if (/^(gemfile|rakefile)$/.test(basename))
    return { language: "ruby", source: "filename" };
  const first = text.split("\n", 1)[0];
  if (/^#!.*\bpython[\d.]*/.test(first))
    return { language: "python", source: "shebang" };
  if (/^#!.*\b(bash|sh|zsh)\b/.test(first))
    return { language: "bash", source: "shebang" };
  if (/^#!.*\bnode\b/.test(first))
    return { language: "javascript", source: "shebang" };
  if (text.trim()) {
    try {
      JSON.parse(text);
      if (/^[\s]*[\[{]/.test(text))
        return { language: "json", source: "content" };
    } catch {}
  }
  if (!text.trim() || text.length > 200000)
    return {
      language: "plaintext",
      source: text.length > 200000 ? "large file" : "content",
    };
  const found = hljs.highlightAuto(text.slice(0, 14000), candidates);
  return {
    language:
      found.relevance >= 3 ? found.language || "plaintext" : "plaintext",
    source: "content",
  };
}
const escapeHTML = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const decode = (s) =>
  s.replace(
    /&(amp|lt|gt|quot|#x27|#39);/g,
    (_, e) =>
      ({ amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'" })[e],
  );
export function splitHighlighted(html) {
  const lines = [[]],
    stack = [];
  let offset = 0;
  for (const token of html.split(/(<\/?span\b[^>]*>)/g)) {
    if (!token) continue;
    if (token.startsWith("<span")) {
      stack.push(token.match(/class="([^"]*)"/)?.[1] || "");
    } else if (token === "</span>") stack.pop();
    else {
      const parts = decode(token).split("\n");
      parts.forEach((text, i) => {
        if (i) {
          lines.push([]);
          offset = 0;
        }
        if (text) {
          lines
            .at(-1)
            .push({
              text,
              start: offset,
              end: offset + text.length,
              classes: stack.join(" "),
            });
          offset += text.length;
        }
      });
    }
  }
  return lines;
}
export function highlightDocument(
  text,
  name,
  override = "auto",
  enabled = true,
) {
  const info = detectLanguage(text, name, override);
  const language = enabled ? info.language : "plaintext";
  let html = escapeHTML(text);
  if (
    language !== "plaintext" &&
    (text.length <= 200000 || override !== "auto")
  ) {
    try {
      html = hljs.highlight(text, { language, ignoreIllegals: true }).value;
    } catch {}
  } else if (language !== "plaintext" && text.length > 200000)
    info.source = "large file";
  return { ...info, lines: splitHighlighted(html) };
}
export function renderSyntaxLine(
  text,
  tokens,
  range = null,
  invisibles = false,
) {
  const chunks = tokens?.length
    ? tokens
    : [{ text, start: 0, end: text.length, classes: "" }];
  let out = "";
  for (const token of chunks) {
    const cuts = [token.start, token.end];
    if (range)
      cuts.push(...range.filter((x) => x > token.start && x < token.end));
    cuts.sort((a, b) => a - b);
    for (let i = 1; i < cuts.length; i++) {
      const start = cuts[i - 1],
        end = cuts[i];
      let str = escapeHTML(
        token.text.slice(start - token.start, end - token.start),
      );
      if (invisibles)
        str = str
          .replace(/ /g, '<span class="invisible">·</span>')
          .replace(/\t/g, '<span class="invisible">⇥   </span>');
      if (token.classes) str = `<span class="${token.classes}">${str}</span>`;
      if (range && start >= range[0] && end <= range[1] && end > start)
        str = "<mark>" + str + "</mark>";
      out += str;
    }
  }
  if (invisibles) out += '<span class="invisible">¬</span>';
  return out || " ";
}
