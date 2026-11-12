import { PdfRefusal } from "../refusals/pdf-refusal";
import type { PdfValue } from "../values/pdf-value";

export interface LengthSource {
  lengthOf(value: PdfValue): number;
}

export class DirectLengths implements LengthSource {
  lengthOf(value: PdfValue): number {
    const length = value.asInteger();
    if (length === null || length < 0) throw new PdfRefusal("A stream in the file does not say its length plainly, so the file was not read.");
    return length;
  }
}
