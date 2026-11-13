import type { NoteLayout } from "../../reading/note-layout";
import { foreignPropertyLinesOf } from "./foreign-property-lines";

const FENCE = "---";

function endedLines(layout: NoteLayout, lines: readonly string[]): string[] {
  const ended: string[] = [];
  for (const line of lines) ended.push(layout.ending.ends(line));
  return ended;
}

export function propertyLinesWith(layout: NoteLayout, imported: readonly string[]): string[] {
  const written = endedLines(layout, imported);
  const block = layout.properties();
  if (block === null) return [layout.ending.ends(FENCE), ...written, layout.ending.ends(FENCE)];
  return [block.opening, ...foreignPropertyLinesOf(block.inside), ...written, block.closing];
}
