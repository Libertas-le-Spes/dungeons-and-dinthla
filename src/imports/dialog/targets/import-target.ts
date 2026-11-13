import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";

export interface ImportTarget {
  readonly buttonWords: string;
  readonly noteName: string;
  readonly choiceWords: string;
  changesFor(sheet: PrintedSheet, today: string): Promise<ImportChanges | null>;
  hasWork(changes: ImportChanges | null): boolean;
  drawPlan(parent: HTMLElement, changes: ImportChanges | null): void;
  bringIn(sheet: PrintedSheet, today: string, changes: ImportChanges | null): Promise<string>;
}
