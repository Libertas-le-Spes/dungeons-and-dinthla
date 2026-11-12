import { PdfValue } from "../pdf-value";

export class PdfBoolean extends PdfValue {
  static readonly TRUE = new PdfBoolean(true);
  static readonly FALSE = new PdfBoolean(false);

  private constructor(readonly value: boolean) {
    super();
  }
}
