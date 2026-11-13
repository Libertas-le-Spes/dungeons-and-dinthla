import { describe, expect, it } from "vitest";
import { inventoryOf } from "../../../../src/beyond/sheet/parts/read-inventory";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { ITEM_ROW_COUNT } from "../../builders/sheet-others";

function itemsOf(sheet: MadeUpSheet) {
  return inventoryOf(new SheetFields(sheet.fields()));
}

function summaryOf(sheet: MadeUpSheet): string[] {
  return itemsOf(sheet).map(summaryOfItem);
}

function summaryOfItem(item: { name: { text: string }; count: { valueOr(whenNotKnown: number): number; isKnown: boolean } }): string {
  return `${item.name.text}:${item.count.isKnown}:${item.count.valueOr(0)}`;
}

describe("the inventory of a sheet", () => {
  it("is every row, with its name and its quantity, in order", () => {
    const rows = Array.from({ length: ITEM_ROW_COUNT }, summaryOfRow);
    expect(summaryOf(MadeUpSheet.monk())).toEqual(rows);
  });

  it("leaves out a row whose name is missing, blank or not text", () => {
    const sheet = MadeUpSheet.monk().without("Eq Name1").with("Eq Name2", "  ").with("Eq Name3", true);
    expect(itemsOf(sheet)).toHaveLength(ITEM_ROW_COUNT - 3);
  });

  it("leaves out a row whose name is too long or breaks across lines, and keeps the rest", () => {
    const sheet = MadeUpSheet.monk().with("Eq Name4", "x".repeat(101)).with("Eq Name5", "two\nlines");
    expect(itemsOf(sheet)).toHaveLength(ITEM_ROW_COUNT - 2);
  });

  it("takes markup out of a name", () => {
    expect(summaryOf(MadeUpSheet.monk().with("Eq Name0", "<b>Primary</b> Rope"))[0]).toBe("Primary Rope:true:1");
  });

  it("has a quantity not known when its field is missing, blank or wrong, and keeps the item", () => {
    const sheet = MadeUpSheet.empty().with("Eq Name0", "Rope").with("Eq Name1", "Torch").with("Eq Qty1", "many").with("Eq Name2", "Chalk").with("Eq Qty2", " ");
    expect(summaryOf(sheet)).toEqual(["Rope:false:0", "Torch:false:0", "Chalk:false:0"]);
  });

  it("has a quantity out of range not known", () => {
    expect(summaryOf(MadeUpSheet.empty().with("Eq Name0", "Rope").with("Eq Qty0", "10000"))).toEqual(["Rope:false:0"]);
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
    expect(itemsOf(MadeUpSheet.empty().with("Eq Name26", "Rope"))).toEqual([]);
  });

  it("is empty on a sheet with no fields", () => {
    expect(itemsOf(MadeUpSheet.empty())).toEqual([]);
  });
});

function summaryOfRow(_unused: unknown, row: number): string {
  return `Item ${row}:true:${row + 1}`;
}
