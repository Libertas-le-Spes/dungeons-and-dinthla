import { describe, expect, it } from "vitest";
import { LightArmour } from "../../../../../src/beyond/rules/input/armour/light-armour";
import { Shield } from "../../../../../src/beyond/rules/input/armour/shield";
import { classOf, itemOf, scoresOf } from "../../../builders/made-up-rule-character";
import { armourClassOf } from "../../../builders/rule-test-helpers";

describe("BarbarianDefenceRule for a barbarian", () => {
  const barbarian = [classOf("Barbarian", 1, 12)];

  it("is 10 plus dexterity plus constitution with no armour", () => {
    expect(armourClassOf({ classes: barbarian, baseScores: scoresOf(10, 14, 16, 10, 10, 10) })).toEqual({ value: 15, working: "10 + DEX 2 + CON 3 = 15, barbarian's unarmoured defence" });
  });

  it("allows a shield", () => {
    expect(armourClassOf({ classes: barbarian, baseScores: scoresOf(10, 14, 16, 10, 10, 10), items: [itemOf("Oak Shield", new Shield(), 2)] })).toEqual({ value: 17, working: "10 + DEX 2 + CON 3 + Oak Shield 2 = 17, barbarian's unarmoured defence" });
  });

  it("takes the plain formula when a negative constitution makes it better", () => {
    expect(armourClassOf({ classes: barbarian, baseScores: scoresOf(10, 14, 8, 10, 10, 10) })).toEqual({ value: 12, working: "10 + DEX 2 = 12, no armour" });
  });

  it("does not use it in armour", () => {
    expect(armourClassOf({ classes: barbarian, baseScores: scoresOf(10, 10, 20, 10, 10, 10), items: [itemOf("Leather", new LightArmour(), 11)] }).value).toBe(11);
  });
});
