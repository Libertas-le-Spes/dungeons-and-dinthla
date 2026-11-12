import type { PdfValue } from "../../../values/pdf-value";
import type { FieldValue } from "../../field-value";

export interface ButtonKind {
  handles(flags: number): boolean;
  read(value: PdfValue): FieldValue | null;
}
