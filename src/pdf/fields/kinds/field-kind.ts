import type { PdfValue } from "../../values/pdf-value";
import type { FieldValue } from "../field-value";

export interface FieldKind {
  typeName: string;
  read(value: PdfValue, flags: number): FieldValue | null;
}
