import { describe, expect, it } from "vitest";
import type { Purse } from "../../../../src/beyond/shape/purse";
import { purseOf } from "../../../../src/beyond/sheet/parts/read-purse";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_PURSE } from "../../builders/sheet-others";
import type { SheetCoin } from "../../builders/sheet-others";

function purseOfSheet(sheet: MadeUpSheet): Purse {
  return purseOf(new SheetFields(sheet.fields()));
}

function unknownCoins(purse: Purse): string[] {
  return SHEET_PURSE.filter(isUnknownIn(purse)).map(coinOf);
}

function isUnknownIn(purse: Purse): (coin: SheetCoin) => boolean {
  return function isUnknown(coin: SheetCoin): boolean {
    return !purse[coin.coin].isKnown;
  };
}

function coinOf(coin: SheetCoin): string {
  return coin.coin;
}

function knownWhen(coin: keyof Purse, field: string): (text: string) => boolean {
  return function known(text: string): boolean {
    return purseOfSheet(MadeUpSheet.monk().with(field, text))[coin].isKnown;
  };
}

describe("the purse of a sheet", () => {
  it.each(SHEET_PURSE)("keeps the printed $coin", ({ coin, value }) => {
    expect(purseOfSheet(MadeUpSheet.monk())[coin].valueOr(-1)).toBe(value);
  });

  it.each(SHEET_PURSE)("has only the $coin not known when $field is missing", ({ coin, field }) => {
    expect(unknownCoins(purseOfSheet(MadeUpSheet.monk().without(field)))).toEqual([coin]);
  });

  it.each(SHEET_PURSE)("keeps the $coin at 0 and at a million, and refuses one above", ({ coin, field }) => {
    const known = knownWhen(coin, field);
    expect([known("0"), known("1000000"), known("1000001")]).toEqual([true, true, false]);
  });
});
