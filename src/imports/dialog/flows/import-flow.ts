import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportTarget } from "../targets/import-target";

export interface ImportFlow {
  readonly title: string;
  refusalFor(sheet: PrintedSheet): string | null;
  targetsFor(sheet: PrintedSheet): ImportTarget[];
}
