import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";
import type { ImportTarget } from "../targets/import-target";

export interface Review {
  readonly sheet: PrintedSheet;
  readonly target: ImportTarget;
  readonly changes: ImportChanges | null;
  readonly refusal: string | null;
}

export interface ReviewActions {
  writeChosen(): void;
  chooseAnother(): void;
  closeChosen(): void;
}
