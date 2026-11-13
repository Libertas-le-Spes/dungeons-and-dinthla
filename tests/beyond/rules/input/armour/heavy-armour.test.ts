import { describe, expect, it } from "vitest";
import type { ArmourKind } from "../../../../../src/beyond/rules/input/armour/armour-kind";
import { HeavyArmour } from "../../../../../src/beyond/rules/input/armour/heavy-armour";

const KIND: ArmourKind = new HeavyArmour();

describe("HeavyArmour", () => {
  it("is called heavy armour and is body armour", () => {
    expect([KIND.label, KIND.isBody, KIND.isShield]).toEqual(["heavy armour", true, false]);
  });

  it.each([-3, 0, 3, 5])("has none of a dexterity modifier of %s", (modifier) => {
    expect(KIND.dexterityPart(modifier)).toBe(0);
  });
});
