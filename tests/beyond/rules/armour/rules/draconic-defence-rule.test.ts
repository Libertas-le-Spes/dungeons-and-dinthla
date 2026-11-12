import { describe, expect, it } from "vitest";
import { LightArmour } from "../../../../../src/beyond/rules/input/armour/light-armour";
import { classOf, itemOf, madeUpRuleCharacter } from "../../../builders/made-up-rule-character";
import { numberNamed } from "../../../builders/rule-numbers";
import { armourClassOf, withDexterity } from "../../../builders/rule-test-helpers";

describe("DraconicDefenceRule for a draconic sorcerer", () => {
  const draconic = [classOf("Sorcerer", 1, 6, "Draconic Bloodline")];

  it("is 13 plus dexterity in the 2014 rules", () => {
    expect(armourClassOf({ classes: draconic, baseScores: withDexterity(14) })).toEqual({ value: 15, working: "13 + DEX 2 = 15, draconic bloodline's natural armour" });
  });

  it.each(["2024", "not stated"] as const)("does not know the armour class when the edition is %s", (edition) => {
    expect(numberNamed(madeUpRuleCharacter({ classes: draconic, edition }), "AC").isKnown).toBe(false);
  });

  it("knows the armour class in armour whatever the edition", () => {
    expect(armourClassOf({ classes: draconic, edition: "2024", items: [itemOf("Leather", new LightArmour(), 11)] }).value).toBe(11);
  });

  it("takes the plain formula when it is better than 13 plus dexterity", () => {
    expect(armourClassOf({ classes: [classOf("Sorcerer", 1, 6, "Wild Magic")], baseScores: withDexterity(14) }).working).toBe("10 + DEX 2 = 12, no armour");
  });
});
