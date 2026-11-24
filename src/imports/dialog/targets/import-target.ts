import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";
import type { ViewElement } from "../../../views/elements/view-element";

export interface ImportTarget {
  readonly buttonWords: string;
  readonly choiceWords: string;
  changesFor(sheet: PrintedSheet, today: string): Promise<ImportChanges | null>;
  hasWork(changes: ImportChanges | null): boolean;
  planOf(changes: ImportChanges | null): ViewElement[];
  bringIn(sheet: PrintedSheet, today: string, changes: ImportChanges | null): Promise<string>;
}
