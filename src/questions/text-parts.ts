import { splitLinks } from "../notes/link";

export interface TextPart {
  text: string;
  link: string | null;
  marked: boolean;
}

function escapeForPattern(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordPattern(keywords: string[]): RegExp | null {
  if (keywords.length === 0) return null;
  const longestFirst = [...keywords].sort((first, second) => second.length - first.length);
  return new RegExp(longestFirst.map(escapeForPattern).join("|"), "gi");
}

function markKeywords(text: string, link: string | null, pattern: RegExp | null): TextPart[] {
  if (pattern === null) return [{ text, link, marked: false }];
  const parts: TextPart[] = [];
  let plainStart = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > plainStart) parts.push({ text: text.slice(plainStart, match.index), link, marked: false });
    parts.push({ text: match[0], link, marked: true });
    plainStart = match.index + match[0].length;
  }
  if (plainStart < text.length) parts.push({ text: text.slice(plainStart), link, marked: false });
  return parts;
}

export function textPartsOf(text: string, keywords: string[]): TextPart[] {
  const pattern = keywordPattern(keywords);
  return splitLinks(text).flatMap((part) => markKeywords(part.text, part.target, pattern));
}
