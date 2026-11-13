import { codePointOfPdfDocCode } from "../pdf-doc-encoding";
import { unreadableText } from "../unreadable-text";
import type { TextEncoding } from "./text-encoding";

export class PdfDocTextEncoding implements TextEncoding {
  matches(): boolean {
    return true;
  }

  decode(bytes: Uint8Array): string {
    let text = "";
    for (const code of bytes) {
      const point = codePointOfPdfDocCode(code);
      if (point === null) throw unreadableText();
      text += String.fromCharCode(point);
    }
    return text;
  }
}
