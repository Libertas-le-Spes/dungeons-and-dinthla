import type { ImportedItem } from "../../shape/imported-item";
import type { LineLoss } from "../lines/line-loss";
import { LineTally } from "../lines/line-tally";
import { listTextAt } from "../lines/list-text";
import type { SheetFields } from "../sheet-fields";
import { ITEM_ROWS } from "../table/item-rows";
import type { ItemRow } from "../table/item-rows";

export interface ReadItems {
  readonly items: readonly ImportedItem[];
  readonly loss: LineLoss;
}

function itemOrNothing(fields: SheetFields, row: ItemRow, tally: LineTally): ImportedItem | null {
  const printed = listTextAt(fields, row.nameField);
  if (printed === null) return null;
  const name = tally.take(printed);
  if (name === null) return null;
  return { name, count: row.quantity.read(fields) };
}

export function inventoryOf(fields: SheetFields): ReadItems {
  const tally = new LineTally();
  const found: ImportedItem[] = [];
  for (const row of ITEM_ROWS) {
    const item = itemOrNothing(fields, row, tally);
    if (item !== null) found.push(item);
  }
  return { items: found, loss: tally.loss() };
}
