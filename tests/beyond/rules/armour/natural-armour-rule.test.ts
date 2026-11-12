import { describe, expect, it } from "vitest";
import { LightArmour } from "../../../../src/beyond/rules/input/armour/light-armour";
import { itemOf, madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

describe("NaturalArmourRule for a species with natural armour", () => {
  it.each(["Tortle", "Lizardfolk", "Loxodon", "Locathah", "Autognome"])("does not know the armour class of a %s", (species) => {
    expect(numberNamed(madeUpRuleCharacter({ species }), "AC").isKnown).toBe(false);
  });

  it("does not know it in armour either, because the natural number may be better", () => {
    const tortle = madeUpRuleCharacter({ species: "Tortle", items: [itemOf("Leather", new LightArmour(), 11)] });
    expect(numberNamed(tortle, "AC").explanation).toBe("Tortle has natural armour, which is not worked out here yet.");
  });
});
