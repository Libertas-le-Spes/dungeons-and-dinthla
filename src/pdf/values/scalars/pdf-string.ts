import { decodeText } from "../../text/decode-text";
import { PdfValue } from "../pdf-value";

export class PdfString extends PdfValue {
  constructor(readonly bytes: Uint8Array) {
    super();
  }

  override asText(): string {
    return decodeText(this.bytes);
  }
}
