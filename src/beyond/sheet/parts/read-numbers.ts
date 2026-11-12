import type { ImportedNumber } from "../../shape/imported-number";
import type { SheetFields } from "../sheet-fields";
import type { NumberRow } from "../numbers/number-row";
import { NUMBER_ROWS } from "../table/numbers/number-rows";

function readIn(fields: SheetFields): (row: NumberRow) => ImportedNumber {
  return function read(row: NumberRow): ImportedNumber {
    return row.read(fields);
  };
}

export function numbersOf(fields: SheetFields): readonly ImportedNumber[] {
  return NUMBER_ROWS.map(readIn(fields));
}
