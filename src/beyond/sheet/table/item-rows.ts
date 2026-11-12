import { ITEM_COUNT } from "../../shape/import-limits";
import { WHOLE } from "../numbers/number-texts";
import { PrintedNumber } from "../numbers/printed-number";

export interface ItemRow {
  readonly nameField: string;
  readonly quantity: PrintedNumber;
}

const LAST_ROW = 25;

function rowOf(position: number): ItemRow {
  return { nameField: `Eq Name${position}`, quantity: new PrintedNumber(`Eq Qty${position}`, ITEM_COUNT, WHOLE) };
}

function itemRows(): readonly ItemRow[] {
  const rows: ItemRow[] = [];
  for (let position = 0; position <= LAST_ROW; position += 1) rows.push(rowOf(position));
  return rows;
}

export const ITEM_ROWS: readonly ItemRow[] = itemRows();
