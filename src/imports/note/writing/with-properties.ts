import type { NoteLayout } from "../reading/note-layout";
import { foreignPropertyLinesOf } from "./foreign-property-lines";

const FENCE = "---";

function endedLines(layout: NoteLayout, lines: readonly string[]): string[] {
  const ended: string[] = [];
  for (const line of lines) ended.push(layout.ending.ends(line));
  return ended;
}

function insideOf(propertyLines: readonly string[]): readonly string[] {
  return propertyLines.slice(1, propertyLines.length - 1);
}

export function propertyLinesWith(layout: NoteLayout, imported: readonly string[]): string[] {
  const written = endedLines(layout, imported);
  if (layout.bodyStart === 0) return [layout.ending.ends(FENCE), ...written, layout.ending.ends(FENCE)];
  const existing = layout.propertyLines();
  const first = existing[0]!;
  const last = existing[existing.length - 1]!;
  return [first, ...foreignPropertyLinesOf(insideOf(existing)), ...written, last];
}
