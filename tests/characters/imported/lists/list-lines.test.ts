import { describe, expect, it } from "vitest";
import { inventoryEntryOf } from "../../../../src/characters/imported/lists/inventory-entry";
import { itemKeyOf } from "../../../../src/characters/imported/lists/item-key";
import { leftOutCountsOf } from "../../../../src/characters/imported/lists/left-out-counts";
import { leftOutWordsOf } from "../../../../src/characters/imported/lists/left-out-words";
import { purseCoinOf, purseCoinsOf } from "../../../../src/characters/imported/lists/purse-coin";

const NOT_LEFT_OUT_COUNTS = ["2 too long", "two too long, 3 not clean", "2 too long, 3 not clear", "2 too long; 3 not clean", "-2 too long, 3 not clean", "2 too long, 3 not clean extra", "2 too long 3 not clean"];

describe("the left-out line's counts", () => {
  it("are read from the words the import writes", () => {
    expect(leftOutCountsOf("2 too long, 3 not clean")).toEqual({ tooLong: 2, notClean: 3 });
  });

  it.each(NOT_LEFT_OUT_COUNTS)("are not read from %s", function notRead(written: string): void {
    expect(leftOutCountsOf(written)).toBeNull();
  });
});

describe("the left-out words on the sheet", () => {
  it("name both kinds in plain words", () => {
    expect(leftOutWordsOf({ tooLong: 2, notClean: 3 })).toBe("Left out: 2 too long, 3 not plain text.");
  });

  it("say one line, not one lines", () => {
    expect(leftOutWordsOf({ tooLong: 1, notClean: 0 })).toBe("Left out: 1 too long.");
    expect(leftOutWordsOf({ tooLong: 0, notClean: 1 })).toBe("Left out: 1 not plain text.");
  });

  it("are none when nothing was left out", () => {
    expect(leftOutWordsOf({ tooLong: 0, notClean: 0 })).toBeNull();
  });
});

describe("an inventory line", () => {
  it("gives the name as written, the name shown, and the count", () => {
    expect(inventoryEntryOf("Rope\\_coil × 2")).toEqual({ written: "Rope\\_coil", name: "Rope_coil", count: "2" });
  });

  it("takes the count after the last ×, so a × in the name stays in it", () => {
    expect(inventoryEntryOf("Box × Lid × 3")).toEqual({ written: "Box × Lid", name: "Box × Lid", count: "3" });
  });

  it("gives no count for one not known", () => {
    expect(inventoryEntryOf("Lantern × ?")).toEqual({ written: "Lantern", name: "Lantern", count: null });
  });

  it("keeps a line with no count whole", () => {
    expect(inventoryEntryOf("Lantern")).toEqual({ written: "Lantern", name: "Lantern", count: null });
  });
});

describe("a purse line", () => {
  it("gives the coin and its count", () => {
    expect(purseCoinOf("gp · 12")).toEqual({ coin: "gp", count: 12 });
  });

  it("gives no count for one not known", () => {
    expect(purseCoinOf("sp · not known")).toEqual({ coin: "sp", count: null });
  });

  it("is no coin without the separator, and is left out of the list", () => {
    expect(purseCoinOf("gp 12")).toBeNull();
    expect(purseCoinsOf(["gp 12", "cp · 4"])).toEqual([{ coin: "cp", count: 4 }]);
  });
});

describe("an item's key", () => {
  it("ignores capitals and runs of spaces, as the funds page does", () => {
    expect(itemKeyOf("  Rope   of  Climbing ")).toBe("rope of climbing");
  });
});
