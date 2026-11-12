import { PdfValue } from "./pdf-value";

export class PdfAbsent extends PdfValue {
  static readonly ABSENT = new PdfAbsent();

  override isPresent(): boolean {
    return false;
  }
}
