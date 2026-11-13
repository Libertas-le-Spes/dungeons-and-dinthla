import { PdfValue } from "../pdf-value";

export class PdfReference extends PdfValue {
  constructor(
    readonly number: number,
    readonly generation: number,
  ) {
    super();
  }

  override asReference(): PdfReference {
    return this;
  }
}
