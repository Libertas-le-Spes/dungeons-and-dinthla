import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";

export interface ImportTarget {
  readonly buttonWords: string;
  readonly noteName: string;
  changesFor(sheet: PrintedSheet, today: string): Promise<ImportChanges | null>;
  write(sheet: PrintedSheet, today: string, changes: ImportChanges | null): Promise<string>;
}
