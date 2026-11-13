import { PdfValue } from "./pdf-value";

export class PdfArray extends PdfValue {
  constructor(readonly items: readonly PdfValue[]) {
    super();
  }

  single(): PdfValue | null {
    const first = this.items.values().next();
    if (this.items.length !== 1 || first.done === true) return null;
    return first.value;
  }

  override asArray(): PdfArray {
    return this;
  }
}
