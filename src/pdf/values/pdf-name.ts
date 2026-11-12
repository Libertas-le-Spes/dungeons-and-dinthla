import { PdfValue } from "./pdf-value";

export class PdfName extends PdfValue {
  constructor(readonly text: string) {
    super();
  }

  override asName(): string {
    return this.text;
  }
}
