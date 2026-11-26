import { firstLineAfterProperties, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { BLOCK_MARKERS, type BlockMarker } from "./hidden-markers";

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;
const INDENTED = /^( {4}|\t)/;
const INLINE_CODE = /`[^`\n]*`/g;

interface Scan {
  closer: string | null;
  marked: boolean;
}

interface NextMarker {
  marker: BlockMarker;
  at: number;
}

function nextMarker(prose: string, from: number): NextMarker | null {
  let next: NextMarker | null = null;
  for (const marker of BLOCK_MARKERS) {
    const at = prose.indexOf(marker.opener, from);
    if (at !== -1 && (next === null || at < next.at)) next = { marker, at };
  }
  return next;
}

function scanned(prose: string, openCloser: string | null): Scan {
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
    const next = nextMarker(prose, from);
    if (next === null) break;
    const opening = next.marker.opening(next.at, prose);
    if (opening.hides) marked = true;
    closer = opening.closer;
    from = opening.next;
  }
  return { closer, marked };
}

function closesFence(line: string, fence: string): boolean {
  const closing = FENCE_CLOSE.exec(line);
  if (closing === null) return false;
  const closingFence = closing[1];
  if (closingFence === undefined) return false;
  return closingFence.startsWith(fence);
}

export function hiddenLines(text: string, syntax: PropertiesSyntax): Set<number> {
  const hidden = new Set<number>();
  const lines = text.split("\n");
  let fence: string | null = null;
  let closer: string | null = null;
  let afterBlank = true;
  let inIndented = false;
  for (let index = firstLineAfterProperties(text, syntax); index < lines.length; index++) {
    const raw = lines[index];
    if (raw === undefined) continue;
    const line = raw.replace(/\r$/, "");
    const blank = line.trim() === "";
    if (fence !== null) {
      hidden.add(index);
      if (closesFence(line, fence)) fence = null;
      afterBlank = true;
      inIndented = false;
      continue;
    }
    const wasOpen = closer !== null;
    const scan = scanned(line.replace(INLINE_CODE, ""), closer);
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
      const openingFence = opening[1];
      if (openingFence !== undefined) fence = openingFence;
      continue;
    }
    if (!blank) inIndented = INDENTED.test(line) && (afterBlank || inIndented);
    if (inIndented && !blank) hidden.add(index);
    afterBlank = blank;
  }
  return hidden;
}

export function addedLinesHidden(textWithAddedLinesLast: string, addedCount: number, syntax: PropertiesSyntax): boolean {
  const lineCount = textWithAddedLinesLast.split("\n").length - 1;
  const hidden = hiddenLines(textWithAddedLinesLast, syntax);
  for (let line = lineCount - addedCount; line < lineCount; line++) {
    if (hidden.has(line)) return true;
  }
  return false;
}
