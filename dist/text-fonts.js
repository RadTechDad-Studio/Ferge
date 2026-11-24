export const DEFAULT_TEXT_FONT = "jetbrains-mono";
export const TEXT_FONTS = new Map([
  [DEFAULT_TEXT_FONT, "JetBrains Mono"],
  ["fira-code", "Fira Code"],
  ["cascadia-code", "Cascadia Code"],
  ["source-code-pro", "Source Code Pro"],
]);

const customFamily = "Ferge Custom Text";
export const CUSTOM_TEXT_STACK = `"${customFamily}", var(--default-text-font)`;

export async function loadCustomTextFont({ name, bytes }) {
  const face = await new FontFace(customFamily, bytes).load();
  return { name, face };
}

async function withFontStore(mode, action) {
  const database = await new Promise((resolve, reject) => {
    const open = indexedDB.open("ferge-fonts", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("fonts");
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("fonts", mode);
      const request = action(transaction.objectStore("fonts"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export function readCustomTextFont() {
  return withFontStore("readonly", (fonts) => fonts.get("custom"));
}

export function saveCustomTextFont(font) {
  return withFontStore("readwrite", (fonts) => fonts.put(font, "custom"));
}
