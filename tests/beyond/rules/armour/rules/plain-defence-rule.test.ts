import { describe, expect, it } from "vitest";
import { LightArmour } from "../../../../../src/beyond/rules/input/armour/light-armour";
import { itemOf, otherItem } from "../../../builders/made-up-rule-character";
import { armourClassOf, withDexterity } from "../../../builders/rule-test-helpers";

describe("PlainDefenceRule with no armour", () => {
  it("is 10 plus the dexterity modifier", () => {
    expect(armourClassOf({ baseScores: withDexterity(18) })).toEqual({ value: 14, working: "10 + DEX 4 = 14, no armour" });
  });

  it("is 10 for a dexterity of 10", () => {
    expect(armourClassOf({})).toEqual({ value: 10, working: "10 + DEX 0 = 10, no armour" });
  });

  it("counts a negative dexterity modifier", () => {
    expect(armourClassOf({ baseScores: withDexterity(8) })).toEqual({ value: 9, working: "10 + DEX -1 = 9, no armour" });
  });

  it("does not count armour that is not equipped", () => {
    const worn = { ...itemOf("Leather", new LightArmour(), 11), equipped: false };
    expect(armourClassOf({ items: [worn] })).toEqual({ value: 10, working: "10 + DEX 0 = 10, no armour" });
  });

  it("does not count a held item that is not armour", () => {
    expect(armourClassOf({ items: [otherItem("Rope")] })).toEqual({ value: 10, working: "10 + DEX 0 = 10, no armour" });
  });
});
