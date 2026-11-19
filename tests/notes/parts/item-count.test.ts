import { describe, expect, it } from "vitest";
import { countedItemOf, countTextOf } from "../../../src/notes/parts/item-count";

describe("the count written after an item's name", () => {
  it.each([
    ["Dagger x5", "Dagger", 5],
    ["Dagger X5", "Dagger", 5],
    ["Dagger ×5", "Dagger", 5],
    ["Dagger × 5", "Dagger", 5],
    ["Dagger x 5", "Dagger", 5],
    ["Potion of healing x9999", "Potion of healing", 9999],
    ["[[Ring of warmth]] x2", "[[Ring of warmth]]", 2],
  ])("reads %j as the item %j, %d of it", (written, item, count) => {
    expect(countedItemOf(written)).toEqual({ item, count });
  });

  it.each([
    ["Dagger"],
    ["Dagger x0"],
    ["Dagger x05"],
    ["Dagger x10000"],
    ["Daggerx5"],
    ["x5"],
    ["Dagger x5 of the north"],
    ["Dagger x-1"],
  ])("reads %j as an item with no count", (written) => {
    expect(countedItemOf(written)).toEqual({ item: written, count: null });
  });

  it("writes a count as x and the number after a space, and nothing for no count", () => {
    expect([countTextOf(2), countTextOf(null)]).toEqual([" x2", ""]);
  });
});
