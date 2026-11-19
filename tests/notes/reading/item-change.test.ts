import { describe, expect, it } from "vitest";
import { readItemChange } from "../../../src/notes/reading/item-change";

describe("readItemChange", () => {
  it("reads a change of holder", () => {
    expect(readItemChange("$$ Silvered lantern :changed to [[Mira]]")).toEqual({
      text: "Silvered lantern :changed to [[Mira]]",
      item: "Silvered lantern",
      count: null,
      named: null,
      namedAfter: [],
      kind: "changed",
      holder: "Mira",
      holderLinked: true,
    });
  });

  it.each([
    ["$$ Dagger x2 :used", "Dagger", 2, "used"],
    ["$$ Dagger x1 :sold 2gp", "Dagger", 1, "sold"],
    ["$$ Ring: +1 x3 :lost", "Ring: +1", 3, "lost"],
    ["$$ Arrow x12 :changed to [[Mira]]", "Arrow", 12, "changed"],
  ])("reads %j as %j, %d of it, %s", (line, item, count, kind) => {
    expect(readItemChange(line)).toMatchObject({ item, count, kind });
  });

  it.each([
    ["$$ Arrow [[Mira]] :lost", "Arrow [[Mira]]", null, { item: "Arrow", holder: "Mira" }],
    ["$$ Arrow x2 [[Mira]] :lost", "Arrow x2 [[Mira]]", 2, { item: "Arrow", holder: "Mira" }],
    ["$$ Arrow [[Mira]] x2 :lost", "Arrow [[Mira]]", 2, { item: "Arrow", holder: "Mira" }],
    ["$$ [[Ring of warmth]] :lost", "[[Ring of warmth]]", null, null],
  ])("reads %j as the item %j, %j of it, naming %j", (line, item, count, named) => {
    expect(readItemChange(line)).toMatchObject({ item, count, named });
  });

  it("reads who a use, sale or loss names after its word, and nobody after a change of hands", () => {
    expect(readItemChange("$$ Arrow :used by [[Mira]]")?.namedAfter).toEqual(["Mira"]);
    expect(readItemChange("$$ Arrow :changed to [[Mira]]")?.namedAfter).toEqual([]);
  });

  it("reads a holder written without a link", () => {
    expect(readItemChange("$$ Silvered lantern :changed to Mira")).toMatchObject({ holder: "Mira", holderLinked: false });
  });

  it("reads a sale and its price", () => {
    expect(readItemChange("$$ Silvered lantern :sold 30gp")).toMatchObject({
      item: "Silvered lantern",
      kind: "sold",
      sale: { copper: 3000 },
    });
  });

  it("reads a sale with no price", () => {
    expect(readItemChange("$$ Silvered lantern :sold")).toEqual({ text: "Silvered lantern :sold", item: "Silvered lantern", count: null, named: null, namedAfter: [], kind: "sold" });
  });

  it("reads an item used up or lost", () => {
    expect(readItemChange("$$ Potion of healing :used")).toEqual({ text: "Potion of healing :used", item: "Potion of healing", count: null, named: null, namedAfter: [], kind: "used" });
    expect(readItemChange("$$ Silvered lantern :lost")).toEqual({ text: "Silvered lantern :lost", item: "Silvered lantern", count: null, named: null, namedAfter: [], kind: "lost" });
  });

  it("leaves a trailing block id out of the holder", () => {
    expect(readItemChange("$$ Rope :changed to Old Tom ^h1")?.holder).toBe("Old Tom");
    expect(readItemChange("$$ Rope :used ^r-1")).toMatchObject({ item: "Rope", count: null, named: null, namedAfter: [], kind: "used" });
  });

  it("leaves a block id before the change word out of the item", () => {
    expect(readItemChange("$$ Rope ^r1 :changed to [[Mira]]")).toMatchObject({ item: "Rope", holder: "Mira" });
    expect(readItemChange("$$ ^r1 :used")).toBeNull();
  });

  it("keeps a colon inside the name", () => {
    expect(readItemChange("$$ Ring: +1 :sold 10 gp")?.item).toBe("Ring: +1");
  });

  it("counts only the last change word", () => {
    expect(readItemChange("$$ Lantern :lost and found :used")).toMatchObject({ item: "Lantern :lost and found", count: null, named: null, namedAfter: [], kind: "used" });
  });

  it("keeps a linked name as written", () => {
    expect(readItemChange("$$ [[Silvered lantern]] :lost")?.item).toBe("[[Silvered lantern]]");
  });

  it("reads a change after a list bullet", () => {
    expect(readItemChange("- $$ Potion of healing :used")?.kind).toBe("used");
  });

  it("reads a line still being typed as nothing", () => {
    expect(readItemChange("$$ lan")).toBeNull();
    expect(readItemChange("$$ Silvered lantern :")).toBeNull();
  });

  it("needs a name before the change", () => {
    expect(readItemChange("$$ :used")).toBeNull();
  });

  it("leaves other lines alone", () => {
    expect(readItemChange("$ Potion of healing")).toBeNull();
    expect(readItemChange("?? letter")).toBeNull();
  });

  it("needs a space before the colon", () => {
    expect(readItemChange("$$ Lantern:sold")).toBeNull();
  });

  it("reads a change word in capitals", () => {
    expect(readItemChange("$$ Lantern :Sold")?.kind).toBe("sold");
  });
});
