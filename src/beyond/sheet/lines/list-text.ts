import { MAX_FIELD_TEXT_CHARACTERS } from "../../../pdf/limits/pdf-limits";
import type { Cap } from "../../shape/cap";
import { refuseAbove } from "../../shape/refuse-above";
import type { SheetFields } from "../sheet-fields";

export const LIST_FIELD: Cap = { what: "A list field of the sheet", most: MAX_FIELD_TEXT_CHARACTERS, unit: "characters" };

export function listTextAt(fields: SheetFields, name: string): string | null {
  const text = fields.textAt(name);
  if (text === null) return null;
  refuseAbove(LIST_FIELD, text.length);
  return text;
}

export function listTextsAt(fields: SheetFields, names: readonly string[]): readonly string[] {
  const texts: string[] = [];
  for (const name of names) {
    const text = listTextAt(fields, name);
    if (text !== null) texts.push(text);
  }
  return texts;
}
