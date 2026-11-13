import type { PdfValue } from "../values/pdf-value";

export interface StreamFilter {
  named(name: string): boolean;
  decode(raw: Uint8Array, parameters: PdfValue, predictorAllowed: boolean): Promise<Uint8Array>;
}
