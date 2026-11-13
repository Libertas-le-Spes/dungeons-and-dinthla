import { SPELL_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import { uniqueLines } from "../../reply/parts/unique-lines";
import { LineTally } from "../lines/line-tally";
import { listTextsAt } from "../lines/list-text";
import type { ReadLines } from "../lines/read-lines";
import type { SheetFields } from "../sheet-fields";
import { SPELL_NAME_FIELDS } from "../table/spell-names";

export function spellsOf(fields: SheetFields): ReadLines {
  const tally = new LineTally();
  for (const text of listTextsAt(fields, SPELL_NAME_FIELDS)) tally.takeLinesOf(text);
  return { lines: uniqueLines(limitedList(tally.lines(), SPELL_COUNT)), loss: tally.loss() };
}
