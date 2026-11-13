import type { FieldValue } from "./fields/field-value";

export interface PdfFieldsRead {
  ok: true;
  fields: ReadonlyMap<string, FieldValue>;
}

export interface PdfRefused {
  ok: false;
  reason: string;
}

export type PdfReadResult = PdfFieldsRead | PdfRefused;
