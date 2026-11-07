const LINK = /\[\[([^[\]]+)\]\]/g;

function targetOf(inside: string): string {
  return inside.replace(/[|#].*$/, "").trim();
}

function shownTextOf(inside: string): string {
  const bar = inside.indexOf("|");
  if (bar === -1) return targetOf(inside);
  return inside.slice(bar + 1).trim();
}

export function findLinks(text: string): string[] {
  const targets: string[] = [];
  for (const [, inside] of text.matchAll(LINK)) {
    if (inside !== undefined) targets.push(targetOf(inside));
  }
  return targets;
}

export function removeFirstLink(text: string): string {
  return text.replace(new RegExp(LINK.source), "");
}

export function unlink(text: string): string {
  return text.replace(LINK, (_link, inside: string) => shownTextOf(inside));
}

export function blankLinks(text: string): string {
  return text.replace(LINK, (link) => " ".repeat(link.length));
}

export interface LinkedText {
  text: string;
  target: string | null;
}

export function splitLinks(text: string): LinkedText[] {
  const parts: LinkedText[] = [];
  let plainStart = 0;
  for (const match of text.matchAll(LINK)) {
    if (match.index > plainStart) parts.push({ text: text.slice(plainStart, match.index), target: null });
    parts.push({ text: shownTextOf(match[1]!), target: targetOf(match[1]!) });
    plainStart = match.index + match[0].length;
  }
  if (plainStart < text.length) parts.push({ text: text.slice(plainStart), target: null });
  return parts;
}
