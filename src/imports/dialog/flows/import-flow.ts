import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportTarget } from "../targets/import-target";

export interface ImportFlow {
  readonly title: string;
  targetsFor(sheet: PrintedSheet): ImportTarget[];
}
