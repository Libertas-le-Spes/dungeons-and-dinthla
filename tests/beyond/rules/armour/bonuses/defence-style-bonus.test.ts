import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../../src/beyond/rules/input/armour/heavy-armour";
import { Shield } from "../../../../../src/beyond/rules/input/armour/shield";
import { CleanLine } from "../../../../../src/beyond/text/clean-line";
import { itemOf, modifierOf } from "../../../builders/made-up-rule-character";
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

describe("DefenceStyleBonus and D&D Beyond's own modifier for it", () => {
  const chain = itemOf("Chain Mail", new HeavyArmour(), 16);
  const own = (restriction: string, changes: Record<string, unknown>) => ({ ...modifierOf("bonus", "armor-class", 1, "Defense", restriction), ...changes });

  it("adds the bonus once when the modifier states it without a restriction", () => {
    expect(armourClassOf({ features: ["Defense"], items: [chain], modifiers: [own("", {})] }).value).toBe(17);
  });

  it("adds it once, from the feature, when the modifier is restricted", () => {
    expect(armourClassOf({ features: ["Defense"], items: [chain], modifiers: [own("while wearing armor", {})] }).value).toBe(17);
  });

  it.each([
    { label: "not in force", changes: { inForce: false }, armourClass: 17 },
    { label: "on another sub-type", changes: { subType: CleanLine.of("speed") }, armourClass: 17 },
    { label: "from another source", changes: { sourceName: CleanLine.of("Pale Charm") }, armourClass: 18 },
  ])("still adds the bonus from the feature when the modifier is $label", ({ changes, armourClass }) => {
    expect(armourClassOf({ features: ["Defense"], items: [chain], modifiers: [own("", changes)] }).value).toBe(armourClass);
  });
});
