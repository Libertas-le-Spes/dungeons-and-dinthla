import { describe, expect, it } from "vitest";
import { readItemChange } from "../../src/notes/item-change";

describe("readItemChange", () => {
  it("reads a change of holder", () => {
    expect(readItemChange("$$ Silvered lantern :changed to [[Mira]]")).toEqual({
      text: "Silvered lantern :changed to [[Mira]]",
      item: "Silvered lantern",
      kind: "changed",
      holder: "Mira",
      holderLinked: true,
    });
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

  it("reads the buyer linked after :sold to, with the price", () => {
    expect(readItemChange("$$ Silvered lantern :sold to [[Old Tom|Tom]] 30 gp")).toMatchObject({
      kind: "sold",
      buyer: "Old Tom",
      sale: { copper: 3000 },
    });
  });

  it("reads no buyer from a link on a sale line without to", () => {
    expect(readItemChange("$$ Silvered lantern :sold 30 gp at [[Old Mill]]")?.buyer).toBeUndefined();
  });

  it("reads a sale with no price", () => {
    expect(readItemChange("$$ Silvered lantern :sold")).toEqual({ text: "Silvered lantern :sold", item: "Silvered lantern", kind: "sold" });
  });

  it("reads an item used up or lost", () => {
    expect(readItemChange("$$ Potion of healing :used")).toEqual({ text: "Potion of healing :used", item: "Potion of healing", kind: "used" });
    expect(readItemChange("$$ Silvered lantern :lost")).toEqual({ text: "Silvered lantern :lost", item: "Silvered lantern", kind: "lost" });
  });

  it("leaves a trailing block id out of the holder", () => {
    expect(readItemChange("$$ Rope :changed to Old Tom ^h1")?.holder).toBe("Old Tom");
    expect(readItemChange("$$ Rope :used ^r-1")).toMatchObject({ item: "Rope", kind: "used" });
  });

  it("leaves a block id before the change word out of the item", () => {
    expect(readItemChange("$$ Rope ^r1 :changed to [[Mira]]")).toMatchObject({ item: "Rope", holder: "Mira" });
    expect(readItemChange("$$ ^r1 :used")).toBeNull();
  });

  it("keeps a colon inside the name", () => {
    expect(readItemChange("$$ Ring: +1 :sold 10 gp")?.item).toBe("Ring: +1");
  });

  it("counts only the last change word", () => {
    expect(readItemChange("$$ Lantern :lost and found :used")).toMatchObject({ item: "Lantern :lost and found", kind: "used" });
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
