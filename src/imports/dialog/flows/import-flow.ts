import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportTarget } from "../targets/import-target";

export interface FlowStart {
  chooseSource(): void;
  bringInKept(beyondNumber: string): void;
}

export interface ImportFlow {
  readonly title: string;
  refusalFor(sheet: PrintedSheet): string | null;
  targetsFor(sheet: PrintedSheet): ImportTarget[];
  start(steps: FlowStart): void;
}
