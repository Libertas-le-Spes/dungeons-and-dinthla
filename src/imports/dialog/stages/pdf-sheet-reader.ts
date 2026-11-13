import { sheetFromPdf, type SheetFromPdf } from "../../../beyond/sheet/from-pdf/sheet-from-pdf";
import type { SheetReader } from "./pdf-stage";

export class PdfSheetReader implements SheetReader {
  sheetOf(bytes: Uint8Array): Promise<SheetFromPdf> {
    return sheetFromPdf(bytes);
  }
}
