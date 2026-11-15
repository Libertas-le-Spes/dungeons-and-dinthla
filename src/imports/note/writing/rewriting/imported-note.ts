import type { PrintedSheet } from "../../../../beyond/sheet/printed-sheet";
import { NoteLayout } from "../../reading/note-layout";
import type { ImportStamp } from "../../properties/import-stamp";
import { propertyLinesOf } from "../../properties/property-lines-of";
import { propertyLinesWith } from "./with-properties";
import { bodyLinesWith } from "./with-sections";

const LINE_BREAK = "\n";

export interface ImportedNote {
  current: string;
  sheet: PrintedSheet;
  stamp: ImportStamp;
}

export function importedNoteText({ current, sheet, stamp }: ImportedNote): string {
  const layout = NoteLayout.of(current);
  const properties = propertyLinesWith(layout, propertyLinesOf({ character: sheet.character, stamp }));
  return properties.concat(bodyLinesWith(layout, sheet)).join(LINE_BREAK);
}
