import { SPELL_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import type { CleanLine } from "../../text/clean-line";
import { uniqueLines } from "../../reply/parts/unique-lines";
import { printedTexts, usableLines } from "../lines/printed-lines";
import type { SheetFields } from "../sheet-fields";
import { SPELL_NAME_FIELDS } from "../table/spell-names";

export function spellsOf(fields: SheetFields): readonly CleanLine[] {
  return uniqueLines(limitedList(usableLines(printedTexts(fields, SPELL_NAME_FIELDS)), SPELL_COUNT));
}
