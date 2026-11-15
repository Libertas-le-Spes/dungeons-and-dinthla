import { describe, expect, it } from "vitest";
import { inventoryOf } from "../../../../src/beyond/reply/parts/read-inventory";
import { MadeUpReply } from "../../builders/made-up-reply";
import { firstOf } from "../../builders/first-of";

function item(name: unknown, quantity: unknown): object {
  return { quantity, definition: { name } };
}

function manyItems(count: number): object[] {
  return Array.from({ length: count }, () => item("Torch", 1));
}

describe("inventoryOf", () => {
  it("reads each item's name and count with the working", () => {
    const found = inventoryOf(MadeUpReply.levelOneMonk().reader());
    expect(found.map((entry) => entry.name.text)).toEqual(["Quarterstaff", "Rope", "Torch"]);
    expect(found.map((entry) => entry.count.valueOr(0))).toEqual([1, 50, 3]);
    expect(found.map((entry) => entry.count.explanation)).toEqual(["Quantity: 1", "Quantity: 50", "Quantity: 3"]);
  });

  it("lists the items added by hand after the others, by name and quantity", () => {
    const reply = MadeUpReply.levelOneMonk().with(["customItems"], [{ name: "Strange Receipt", quantity: 2 }]);
    const found = inventoryOf(reply.reader());
    expect(found.map((entry) => [entry.name.text, entry.count.valueOr(0)])).toEqual([["Quarterstaff", 1], ["Rope", 50], ["Torch", 3], ["Strange Receipt", 2]]);
  });

  it("reads a reply that lists no items added by hand", () => {
    expect(inventoryOf(MadeUpReply.levelOneMonk().without(["customItems"]).reader())).toHaveLength(3);
  });

  it("refuses an item added by hand with no name", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["customItems"], [{ quantity: 1 }]).reader())).toThrow('"name" is missing or is not text');
  });

  it("reads an empty inventory", () => {
    expect(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], []).reader())).toEqual([]);
  });

  it("refuses a missing inventory", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().without(["inventory"]).reader())).toThrow('"inventory" is missing or is not a list');
  });

  it("refuses an inventory given as an object", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], { 0: item("Rope", 1) }).reader())).toThrow("not a list");
  });

  it("takes 500 items and refuses 501", () => {
    expect(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], manyItems(500)).reader())).toHaveLength(500);
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], manyItems(501)).reader())).toThrow("The inventory is over the limit of 500 items.");
  });

  it("refuses an item with no definition", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [{ quantity: 1 }]).reader())).toThrow('"definition" is missing');
  });

  it("refuses an item with no name or a name that is not text", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [{ quantity: 1, definition: {} }]).reader())).toThrow('"name" is missing');
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [item(7, 1)]).reader())).toThrow("not text");
  });

  it("refuses an item that is not an object", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], ["Rope"]).reader())).toThrow("is missing");
  });

  it("keeps the characters a note would escape in an item name, for the file name", () => {
    expect(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [item("[[Rope]]", 1)]).reader()).map((entry) => entry.name.text)).toEqual(["[[Rope]]"]);
  });

  it("refuses an item name over the name cap", () => {
    expect(() => inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [item("a".repeat(101), 1)]).reader())).toThrow("over the limit of 100 characters");
  });

  it("marks only the count not known when the quantity is missing", () => {
    const rope = firstOf(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [{ definition: { name: "Rope" } }]).reader()));
    expect(rope?.name.text).toBe("Rope");
    expect(rope?.count.isKnown).toBe(false);
    expect(rope?.count.explanation).toBe("An item count is missing or is not a number.");
  });

  it.each(["3", null, true, [3], 2.5, -1, 10_000, Infinity])("marks the quantity %j not known", (quantity) => {
    const rope = firstOf(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [item("Rope", quantity)]).reader()));
    expect(rope?.count.isKnown).toBe(false);
  });

  it.each([0, 9_999])("takes the quantity %i at the edge of the range", (quantity) => {
    const rope = firstOf(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [item("Rope", quantity)]).reader()));
    expect(rope?.count.valueOr(-1)).toBe(quantity);
  });

  it("ignores fields it does not read", () => {
    const rope = firstOf(inventoryOf(MadeUpReply.levelOneMonk().with(["inventory"], [{ quantity: 1, definition: { name: "Rope", weight: 10 }, equipped: true }]).reader()));
    expect(Object.keys(rope)).toEqual(["name", "count"]);
  });
});
