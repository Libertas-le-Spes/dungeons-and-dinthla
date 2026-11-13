import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { NoteLayout } from "../reading/note-layout";
import { propertyLinesOf } from "../properties/property-lines-of";
import { propertyLinesWith } from "./with-properties";
import { bodyLinesWith } from "./with-sections";

const LINE_BREAK = "\n";

export function importedNoteText(current: string, sheet: PrintedSheet, today: string): string {
  const layout = NoteLayout.of(current);
  const properties = propertyLinesWith(layout, propertyLinesOf(sheet.character, today));
  return [...properties, ...bodyLinesWith(layout, sheet)].join(LINE_BREAK);
}
