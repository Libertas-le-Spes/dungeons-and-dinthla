import { FEATURE_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import type { CleanLine } from "../../text/clean-line";
import { printedTexts, usableLines } from "../lines/printed-lines";
import type { SheetFields } from "../sheet-fields";
import { FEATURE_FIELDS } from "../table/feature-fields";

export function featuresOf(fields: SheetFields): readonly CleanLine[] {
  return limitedList(usableLines(printedTexts(fields, FEATURE_FIELDS)), FEATURE_COUNT);
}
