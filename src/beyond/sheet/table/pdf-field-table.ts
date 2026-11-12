import { CHARACTER_NAME, CLASS_AND_LEVEL, SPECIES } from "./identity-fields";
import { FEATURE_FIELDS } from "./feature-fields";
import { ITEM_ROWS } from "./item-rows";
import type { ItemRow } from "./item-rows";
import type { NumberRow } from "../numbers/number-row";
import type { PrintedNumber } from "../numbers/printed-number";
import { NUMBER_ROWS } from "./numbers/number-rows";
import { SCORE_FIELDS } from "./numbers/score-rows";
import { PURSE_FIELDS } from "./purse-rows";
import { SPELL_NAME_FIELDS } from "./spell-names";

function fieldOfPrinted(printed: PrintedNumber): string {
  return printed.fieldName;
}

function fieldOfRow(row: NumberRow): string {
  return row.fieldName;
}

function itemFields(row: ItemRow): readonly string[] {
  return [row.nameField, row.quantity.fieldName];
}

export function printedFieldNames(): readonly string[] {
  return [
    CHARACTER_NAME,
    SPECIES,
    CLASS_AND_LEVEL,
    ...Object.values(SCORE_FIELDS).map(fieldOfPrinted),
    ...NUMBER_ROWS.map(fieldOfRow),
    ...Object.values(PURSE_FIELDS).map(fieldOfPrinted),
    ...ITEM_ROWS.flatMap(itemFields),
    ...SPELL_NAME_FIELDS,
    ...FEATURE_FIELDS,
  ];
}
