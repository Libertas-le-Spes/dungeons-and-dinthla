import { describe, expect, it } from "vitest";
import { inventoryOf } from "../../../../src/beyond/sheet/parts/read-inventory";
import type { ReadItems } from "../../../../src/beyond/sheet/parts/read-inventory";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { ITEM_ROW_COUNT } from "../../builders/sheet-others";

function itemsOf(sheet: MadeUpSheet): ReadItems {
  return inventoryOf(new SheetFields(sheet.fields()));
}

function summaryOf(sheet: MadeUpSheet): string[] {
  return itemsOf(sheet).items.map(summaryOfItem);
}

function summaryOfItem(item: { name: { text: string }; count: { valueOr(whenNotKnown: number): number; isKnown: boolean } }): string {
  return `${item.name.text}:${item.count.isKnown}:${item.count.valueOr(0)}`;
}

function everyRow(): string[] {
  const rows: string[] = [];
  for (let row = 0; row < ITEM_ROW_COUNT; row += 1) rows.push(`Item ${row}:true:${row + 1}`);
  return rows;
}

describe("the inventory of a sheet", () => {
  it("is every row, with its name and its quantity, in order", () => {
    expect(summaryOf(MadeUpSheet.monk())).toEqual(everyRow());
  });

  it("leaves out a row whose name is missing, blank or not text, and counts none of them lost", () => {
    const sheet = MadeUpSheet.monk().without("Eq Name1").with("Eq Name2", "  ").with("Eq Name3", true);
    const found = itemsOf(sheet);
    expect([found.items.length, found.loss]).toEqual([ITEM_ROW_COUNT - 3, { tooLong: 0, notClean: 0 }]);
  });

  it("counts a row whose name is 101 characters as too long, and a row whose name breaks across lines as not clean", () => {
    const sheet = MadeUpSheet.monk().with("Eq Name4", "x".repeat(101)).with("Eq Name5", "two\nlines");
    const found = itemsOf(sheet);
    expect([found.items.length, found.loss]).toEqual([ITEM_ROW_COUNT - 2, { tooLong: 1, notClean: 1 }]);
  });

  it("counts a name of 301 characters as too long", () => {
    expect(itemsOf(MadeUpSheet.empty().with("Eq Name0", "x".repeat(301))).loss).toEqual({ tooLong: 1, notClean: 0 });
  });

  it("keeps a name of 100 characters", () => {
    expect(itemsOf(MadeUpSheet.empty().with("Eq Name0", "x".repeat(100))).loss).toEqual({ tooLong: 0, notClean: 0 });
  });

  it("refuses a name field over 8,000 characters", () => {
    expect(() => itemsOf(MadeUpSheet.empty().with("Eq Name0", "x".repeat(8001)))).toThrow("A list field of the sheet is over the limit");
  });

  it("takes markup out of a name", () => {
    expect(summaryOf(MadeUpSheet.empty().with("Eq Name0", "<b>Primary</b> Rope").with("Eq Qty0", "1"))).toEqual(["Primary Rope:true:1"]);
  });

  it("has a quantity not known when its field is missing, blank or wrong, and keeps the item", () => {
    const sheet = MadeUpSheet.empty().with("Eq Name0", "Rope").with("Eq Name1", "Torch").with("Eq Qty1", "many").with("Eq Name2", "Chalk").with("Eq Qty2", " ");
    expect(summaryOf(sheet)).toEqual(["Rope:false:0", "Torch:false:0", "Chalk:false:0"]);
  });

  it("has a quantity of 9999 known and 10000 not known, in every row", () => {
    for (let row = 0; row < ITEM_ROW_COUNT; row += 1) {
      const atMost = MadeUpSheet.empty().with(`Eq Name${row}`, "Rope").with(`Eq Qty${row}`, "9999");
      const over = MadeUpSheet.empty().with(`Eq Name${row}`, "Rope").with(`Eq Qty${row}`, "10000");
      expect([summaryOf(atMost), summaryOf(over)]).toEqual([["Rope:true:9999"], ["Rope:false:0"]]);
    }
  });

  it("has a quantity of zero known", () => {
    expect(summaryOf(MadeUpSheet.empty().with("Eq Name0", "Rope").with("Eq Qty0", "0"))).toEqual(["Rope:true:0"]);
  });

  it("ignores a row beyond the last one the sheet has", () => {
    expect(itemsOf(MadeUpSheet.empty().with("Eq Name26", "Rope")).items).toEqual([]);
  });

  it("is empty on a sheet with no fields", () => {
    expect(itemsOf(MadeUpSheet.empty()).items).toEqual([]);
  });
});
