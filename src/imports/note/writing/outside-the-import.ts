import { NoteLayout } from "../reading/note-layout";
import { foreignPropertyLinesOf } from "./foreign-property-lines";

function insideOf(propertyLines: readonly string[]): readonly string[] {
  return propertyLines.slice(1, propertyLines.length - 1);
}

function bodyOutsideSections(layout: NoteLayout): string[] {
  const outside: string[] = [];
  let cursor = layout.bodyStart;
  for (const span of layout.spans) {
    outside.push(...layout.lines.slice(cursor, span.start));
    cursor = span.end;
  }
  outside.push(...layout.lines.slice(cursor));
  return outside;
}

export function outsideTheImport(text: string): string[] {
  const layout = NoteLayout.of(text);
  const foreign = foreignPropertyLinesOf(insideOf(layout.propertyLines()));
  return [...foreign, ...bodyOutsideSections(layout)];
}
