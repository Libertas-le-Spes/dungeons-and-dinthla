import { FEATURE_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import { LineTally } from "../lines/line-tally";
import { listTextsAt } from "../lines/list-text";
import type { ReadLines } from "../lines/read-lines";
import type { SheetFields } from "../sheet-fields";
import { FEATURE_FIELDS } from "../table/feature-fields";

export function featuresOf(fields: SheetFields): ReadLines {
  const tally = new LineTally();
  for (const text of listTextsAt(fields, FEATURE_FIELDS)) tally.takeLinesOf(text);
  return { lines: limitedList(tally.lines(), FEATURE_COUNT), loss: tally.loss() };
}
