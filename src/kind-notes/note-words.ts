import { getFrontMatterInfo } from "obsidian";

export function wordsOf(text: string): string {
  return text.substring(getFrontMatterInfo(text).contentStart);
}

export function hasNoWords(text: string): boolean {
  return wordsOf(text).trim() === "";
}
