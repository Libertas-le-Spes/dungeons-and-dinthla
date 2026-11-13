import { describe, expect, it } from "vitest";
import { shownItemName } from "../../../../src/characters/imported/lists/shown-item-name";

describe("an item's name on the funds page", () => {
  it.each([
    ["Rope\\_coil", "Rope_coil"],
    ["\\(Ammo) Arrows", "(Ammo) Arrows"],
    ["Potion\\: Healing", "Potion: Healing"],
  ])("takes off the escapes of %s, which the import would write so", (name, shown) => {
    expect(shownItemName(name)).toBe(shown);
  });

  it.each(["\\o/ banner", "Rope \\coil", "Rope_coil"])("is %s as written, which the import wouldn't write so", (name) => {
    expect(shownItemName(name)).toBe(name);
  });
});
