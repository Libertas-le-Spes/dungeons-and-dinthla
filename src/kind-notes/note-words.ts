import { getFrontMatterInfo } from "obsidian";

export function wordsOf(text: string): string {
  return text.substring(getFrontMatterInfo(text).contentStart);
}

export function hasNoWords(text: string): boolean {
  return wordsOf(text).trim() === "";
}

const PLUGIN_PROPERTIES = ["session", "lines"];
const A_KEY = /^(["']?)([^"':]+)\1\s*:/;

function isContinuation(line: string): boolean {
  return /^\s/.test(line) || line.startsWith("- ");
}

function isPluginsLine(line: string): boolean {
  const key = A_KEY.exec(line);
  if (key === null) return false;
  const [, , name] = key;
  return name !== undefined && PLUGIN_PROPERTIES.includes(name.trim());
}

export function holdsOnlyPluginPropertiesIn(text: string): boolean {
  for (const line of getFrontMatterInfo(text).frontmatter.split("\n")) {
    if (line.trim() === "" || isContinuation(line)) continue;
    if (!isPluginsLine(line)) return false;
  }
  return true;
}
