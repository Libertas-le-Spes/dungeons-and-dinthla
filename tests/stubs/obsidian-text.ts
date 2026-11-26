import type { FrontMatterInfo } from "obsidian";

const PROPERTIES_OPEN = /^---\r?\n/;

export function getFrontMatterInfo(content: string): FrontMatterInfo {
  const none = { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
  const opening = PROPERTIES_OPEN.exec(content);
  if (opening === null) return none;
  const from = opening[0].length;
  const closing = /---(?:\r?\n|$)/g;
  closing.lastIndex = from;
  let close = closing.exec(content);
  while (close !== null && content.charAt(close.index - 1) !== "\n") close = closing.exec(content);
  if (close === null) return none;
  return {
    exists: true,
    frontmatter: content.slice(from, close.index),
    from,
    to: close.index,
    contentStart: close.index + close[0].length,
  };
}

export function normalizePath(path: string): string {
  let normalized = path.replace(/[\\/]+/g, "/").replace(/^\/+|\/+$/g, "");
  if (normalized === "") normalized = "/";
  return normalized.replace(/ | /g, " ").normalize("NFC");
}

export function getLinkpath(linktext: string): string {
  return linktext.replace(/#.*$/, "");
}
