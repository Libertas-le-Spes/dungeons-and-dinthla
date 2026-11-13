import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../../src/beyond/rules/input/armour/heavy-armour";
import { Shield } from "../../../../../src/beyond/rules/input/armour/shield";
import { itemOf } from "../../../builders/made-up-rule-character";
import { armourClassOf } from "../../../builders/rule-test-helpers";

describe("DefenceStyleBonus", () => {
  it("adds one for the Defense fighting style in armour", () => {
    expect(armourClassOf({ features: ["Defense"], items: [itemOf("Chain Mail", new HeavyArmour(), 16)] })).toEqual({ value: 17, working: "Chain Mail 16 + DEX 0 + Defense 1 = 17, heavy armour" });
  });

  it("adds nothing for the Defense fighting style with no armour", () => {
    expect(armourClassOf({ features: ["Defense"] }).value).toBe(10);
  });

  it("adds nothing for the Defense fighting style when only a shield is held", () => {
    expect(armourClassOf({ features: ["Defense"], items: [itemOf("Oak Shield", new Shield(), 2)] }).value).toBe(12);
  });
});
