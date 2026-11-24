import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import { NoteLayout } from "../../reading/note-layout";
import type { ImportStamp } from "../../properties/import-stamp";
import { propertyLinesOf } from "../../properties/property-lines-of";
import { propertyLinesWith } from "./with-properties";
import { bodyLinesWith } from "./with-sections";
import type { PropertiesSyntax } from "../../../../campaign/paths/session-file";

const LINE_BREAK = "\n";

export interface ImportedNote {
  current: string;
  sheet: PrintedSheet;
  stamp: ImportStamp;
}

export function importedNoteText({ current, sheet, stamp }: ImportedNote, syntax: PropertiesSyntax): string {
  const layout = NoteLayout.of(current, syntax);
  const properties = propertyLinesWith(layout, propertyLinesOf({ character: sheet.character, stamp, beyondNumber: sheet.beyondNumber }));
  return properties.concat(bodyLinesWith(layout, sheet)).join(LINE_BREAK);
}
