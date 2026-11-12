import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../../src/beyond/rules/input/armour/heavy-armour";
import { Shield } from "../../../../../src/beyond/rules/input/armour/shield";
import { DEXTERITY } from "../../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../../src/beyond/rules/input/by-ability";
import { armourClassOf, classOf, itemOf, madeUpRuleCharacter, numberNamed, scoresOf } from "../../../builders/made-up-rule-character";

describe("MonkDefenceRule for a monk", () => {
  const monk = [classOf("Monk", 1, 8)];
  const wise = scoresOf(10, 18, 10, 10, 14, 10);

  it("is 10 plus dexterity plus wisdom with no armour and no shield", () => {
    expect(armourClassOf({ classes: monk, baseScores: wise })).toEqual({ value: 16, working: "10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence" });
  });

  it("falls back to the plain formula with a shield", () => {
    expect(armourClassOf({ classes: monk, baseScores: wise, items: [itemOf("Oak Shield", new Shield(), 2)] })).toEqual({ value: 16, working: "10 + DEX 4 + Oak Shield 2 = 16, no armour" });
  });

  it("does not use the monk's formula in armour", () => {
    expect(armourClassOf({ classes: monk, baseScores: wise, items: [itemOf("Chain Mail", new HeavyArmour(), 16)] }).value).toBe(16);
  });

  it("does not know the armour class when the wisdom modifier is not known", () => {
    const scores = new AbilityTable<number>().with(DEXTERITY, 14);
    expect(numberNamed(madeUpRuleCharacter({ classes: monk, baseScores: scores }), "AC").isKnown).toBe(false);
  });
});
