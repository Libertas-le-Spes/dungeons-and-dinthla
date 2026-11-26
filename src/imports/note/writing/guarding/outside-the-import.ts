import { NoteLayout } from "../../reading/note-layout";
import { foreignPropertyLinesOf } from "../rewriting/foreign-property-lines";
import type { PropertiesSyntax } from "../../../../campaign/paths/session-file";

function propertiesOutside(layout: NoteLayout): string[] {
  const block = layout.properties();
  if (block === null) return [];
  return foreignPropertyLinesOf(block.inside);
}

function bodyOutsideSections(layout: NoteLayout): string[] {
  let outside: string[] = [];
  let cursor = layout.bodyStart;
  for (const span of layout.spans) {
    outside = outside.concat(layout.lines.slice(cursor, span.start));
    cursor = span.end;
  }
  return outside.concat(layout.lines.slice(cursor));
}

export function outsideTheImport(text: string, syntax: PropertiesSyntax): string[] {
  const layout = NoteLayout.of(text, syntax);
  return propertiesOutside(layout).concat(bodyOutsideSections(layout));
}
