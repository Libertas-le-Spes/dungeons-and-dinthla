import { describe, expect, it } from "vitest";
import { purseOf } from "../../../../src/beyond/sheet/parts/read-purse";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_PURSE } from "../../builders/sheet-others";

const COINS = Object.entries(SHEET_PURSE);

describe("the purse of a sheet", () => {
  it.each(COINS)("keeps the printed %s", (coin, printed) => {
    const purse = purseOf(new SheetFields(MadeUpSheet.monk().fields()));
    expect(Reflect.get(purse, coin).valueOr(-1)).toBe(printed.value);
  });

  it.each(COINS)("has only the %s not known when its field is missing", (coin, printed) => {
    const purse = purseOf(new SheetFields(MadeUpSheet.monk().without(printed.field).fields()));
    const unknown = Object.entries(purse).filter(isNotKnown).map(nameOf);
    expect(unknown).toEqual([coin]);
  });

  it("has a coin count out of range not known", () => {
    const purse = purseOf(new SheetFields(MadeUpSheet.monk().with("GP", "1000001").fields()));
    expect(purse.gold.isKnown).toBe(false);
  });

  it("has a coin count at the most known", () => {
    const purse = purseOf(new SheetFields(MadeUpSheet.monk().with("GP", "1000000").fields()));
    expect(purse.gold.valueOr(0)).toBe(1_000_000);
  });
});

function isNotKnown(entry: [string, { isKnown: boolean }]): boolean {
  return !entry[1].isKnown;
}

function nameOf(entry: [string, unknown]): string {
  return entry[0];
}
