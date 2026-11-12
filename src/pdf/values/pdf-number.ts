import { PdfValue } from "./pdf-value";

export class PdfNumber extends PdfValue {
  constructor(
    readonly value: number,
    private readonly isWhole: boolean,
  ) {
    super();
  }

  override asInteger(): number | null {
    if (!this.isWhole) return null;
    return this.value;
  }
}
