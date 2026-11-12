import { getFrontMatterInfo } from "obsidian";
import { PLUGIN_PROPERTIES } from "./note-properties";

export function wordsOf(text: string): string {
  return text.substring(getFrontMatterInfo(text).contentStart);
}

export function hasNoWords(text: string): boolean {
  return wordsOf(text).trim() === "";
}

const A_KEY = /^(["']?)([^"':]+)\1\s*:/;

function isContinuation(line: string): boolean {
  return /^\s/.test(line) || line.startsWith("- ");
}

function nameOfKey(key: RegExpExecArray): string {
  const [, , name] = key;
  if (name === undefined) return "";
  return name.trim();
}

function isPluginsLine(line: string): boolean {
  const key = A_KEY.exec(line);
  if (key === null) return false;
  return PLUGIN_PROPERTIES.includes(nameOfKey(key));
}

export function holdsOnlyPluginPropertiesIn(text: string): boolean {
  for (const line of getFrontMatterInfo(text).frontmatter.split("\n")) {
    if (line.trim() === "" || isContinuation(line)) continue;
    if (!isPluginsLine(line)) return false;
  }
  return true;
}
