import { PdfValue } from "../pdf-value";

export class PdfNull extends PdfValue {
  static readonly NULL = new PdfNull();

  override isPresent(): boolean {
    return false;
  }
}
