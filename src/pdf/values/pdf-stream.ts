import type { PdfDictionary } from "./pdf-dictionary";
import { PdfValue } from "./pdf-value";

export class PdfStream extends PdfValue {
  constructor(
    readonly dictionary: PdfDictionary,
    readonly start: number,
    readonly length: number,
  ) {
    super();
  }

  override asStream(): PdfStream {
    return this;
  }
}
