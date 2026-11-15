import type { CleanLine } from "../../text/clean-line";
import { lineOrNothing } from "../lines/line-or-nothing";
import type { SheetFields } from "../sheet-fields";

export function printedLineOf(fields: SheetFields, fieldName: string): CleanLine | null {
  const printed = fields.textAt(fieldName);
  if (printed === null) return null;
  return lineOrNothing(printed);
}
