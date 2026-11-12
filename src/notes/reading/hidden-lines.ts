import { firstLineAfterProperties } from "../../campaign/paths/session-file";

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;
const INDENTED = /^( {4}|\t)/;
const INLINE_CODE = /`[^`\n]*`/g;

export type Closers = Map<string, string>;

export const CLOSERS_WITHOUT_MATH: Closers = new Map([
  ["%%", "%%"],
  ["<!--", "-->"],
]);

export const COMMENT_AND_MATH_CLOSERS: Closers = new Map([...CLOSERS_WITHOUT_MATH, ["$$", "$$"]]);

interface Scan {
  closer: string | null;
  marked: boolean;
}

function nextOpener(closers: Closers, prose: string, from: number): { opener: string; at: number } | null {
  let next: { opener: string; at: number } | null = null;
  for (const opener of closers.keys()) {
    const at = prose.indexOf(opener, from);
    if (at !== -1 && (next === null || at < next.at)) next = { opener, at };
  }
  return next;
}

function scanned(closers: Closers, prose: string, openCloser: string | null): Scan {
  let closer = openCloser;
  let marked = false;
  let from = 0;
  while (from <= prose.length) {
    if (closer !== null) {
      const end = prose.indexOf(closer, from);
      if (end === -1) break;
      marked = true;
      from = end + closer.length;
      closer = null;
      continue;
    }
    const next = nextOpener(closers, prose, from);
    if (next === null) break;
    marked = true;
    closer = closers.get(next.opener)!;
    from = next.at + next.opener.length;
  }
  return { closer, marked };
}

function closesFence(line: string, fence: string): boolean {
  const closing = FENCE_CLOSE.exec(line);
  return closing !== null && closing[1]!.startsWith(fence);
}

export function hiddenLinesWith(closers: Closers, text: string): Set<number> {
  const hidden = new Set<number>();
  const lines = text.split("\n");
  let fence: string | null = null;
  let closer: string | null = null;
  let afterBlank = true;
  let inIndented = false;
  for (let index = firstLineAfterProperties(text); index < lines.length; index++) {
    const line = lines[index]!.replace(/\r$/, "");
    const blank = line.trim() === "";
    if (fence !== null) {
      hidden.add(index);
      if (closesFence(line, fence)) fence = null;
      afterBlank = true;
      inIndented = false;
      continue;
    }
    const wasOpen = closer !== null;
    const scan = scanned(closers, line.replace(INLINE_CODE, ""), closer);
    closer = scan.closer;
    if (wasOpen || scan.marked) {
      hidden.add(index);
      afterBlank = false;
      inIndented = false;
      continue;
    }
    const opening = FENCE_OPEN.exec(line);
    if (opening !== null) {
      hidden.add(index);
      fence = opening[1]!;
      continue;
    }
    if (!blank) inIndented = INDENTED.test(line) && (afterBlank || inIndented);
    if (inIndented && !blank) hidden.add(index);
    afterBlank = blank;
  }
  return hidden;
}

export function hiddenLines(text: string): Set<number> {
  return hiddenLinesWith(COMMENT_AND_MATH_CLOSERS, text);
}

export function addedLinesHiddenWith(closers: Closers, textWithAddedLinesLast: string, addedCount: number): boolean {
  const lineCount = textWithAddedLinesLast.split("\n").length - 1;
  const hidden = hiddenLinesWith(closers, textWithAddedLinesLast);
  for (let line = lineCount - addedCount; line < lineCount; line++) {
    if (hidden.has(line)) return true;
  }
  return false;
}

export function addedLinesHidden(textWithAddedLinesLast: string, addedCount: number): boolean {
  return addedLinesHiddenWith(COMMENT_AND_MATH_CLOSERS, textWithAddedLinesLast, addedCount);
}
