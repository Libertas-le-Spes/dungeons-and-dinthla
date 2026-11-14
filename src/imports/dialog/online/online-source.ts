import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";

export interface OnlineSource {
  sheetFor(link: string): Promise<PrintedSheet>;
}
