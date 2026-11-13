import type { ImportedItem } from "../../shape/imported-item";
import { lineOrNothing } from "../lines/line-or-nothing";
import type { SheetFields } from "../sheet-fields";
import { ITEM_ROWS } from "../table/item-rows";
import type { ItemRow } from "../table/item-rows";

function itemOrNothing(fields: SheetFields, row: ItemRow): ImportedItem | null {
  const printed = fields.textAt(row.nameField);
  if (printed === null) return null;
  const name = lineOrNothing(printed);
  if (name === null) return null;
  return { name, count: row.quantity.read(fields) };
}

export function inventoryOf(fields: SheetFields): readonly ImportedItem[] {
  const found: ImportedItem[] = [];
  for (const row of ITEM_ROWS) {
    const item = itemOrNothing(fields, row);
    if (item !== null) found.push(item);
  }
  return found;
}
