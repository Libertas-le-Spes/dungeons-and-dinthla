import { splitLinks } from "../../notes/parts/link";

export interface MarkedPiece {
  text: string;
  marked: boolean;
}

export interface TextRun {
  linktext: string | null;
  pieces: MarkedPiece[];
}

function escapeForPattern(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordPattern(keywords: string[]): RegExp | null {
  if (keywords.length === 0) return null;
  const longestFirst = [...keywords].sort((first, second) => second.length - first.length);
  return new RegExp(longestFirst.map(escapeForPattern).join("|"), "gi");
}

function markKeywords(text: string, pattern: RegExp | null): MarkedPiece[] {
  if (pattern === null) return [{ text, marked: false }];
  const pieces: MarkedPiece[] = [];
  let plainStart = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > plainStart) pieces.push({ text: text.slice(plainStart, match.index), marked: false });
    pieces.push({ text: match[0], marked: true });
    plainStart = match.index + match[0].length;
  }
  if (plainStart < text.length) pieces.push({ text: text.slice(plainStart), marked: false });
  return pieces;
}

export function textRunsOf(text: string, keywords: string[]): TextRun[] {
  const pattern = keywordPattern(keywords);
  return splitLinks(text).map((part) => ({ linktext: part.linktext, pieces: markKeywords(part.text, pattern) }));
}
