import { describe, expect, it } from "vitest";
import { readItemChange } from "../../src/notes/item-change";

describe("readItemChange", () => {
  it("reads a change of holder", () => {
    expect(readItemChange("$$ Silvered lantern :changed to [[Mira]]")).toEqual({
      text: "Silvered lantern :changed to [[Mira]]",
      item: "Silvered lantern",
      kind: "changed",
      holder: "Mira",
    });
  });

  it("reads a holder written without a link", () => {
    expect(readItemChange("$$ Silvered lantern :changed to Mira")?.holder).toBe("Mira");
  });

  it("reads a sale and its price", () => {
    expect(readItemChange("$$ Silvered lantern :sold 30gp")).toMatchObject({
      item: "Silvered lantern",
      kind: "sold",
      sale: { copper: 3000 },
    });
  });

  it("reads a sale with no price", () => {
    expect(readItemChange("$$ Silvered lantern :sold")).toEqual({ text: "Silvered lantern :sold", item: "Silvered lantern", kind: "sold" });
  });

  it("reads an item used up or lost", () => {
    expect(readItemChange("$$ Potion of healing :used")).toEqual({ text: "Potion of healing :used", item: "Potion of healing", kind: "used" });
    expect(readItemChange("$$ Silvered lantern :lost")).toEqual({ text: "Silvered lantern :lost", item: "Silvered lantern", kind: "lost" });
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
