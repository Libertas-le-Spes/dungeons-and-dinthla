import { describe, expect, it } from "vitest";
import type { ArmourKind } from "../../../../../src/beyond/rules/input/armour/armour-kind";
import { LightArmour } from "../../../../../src/beyond/rules/input/armour/light-armour";

const KIND: ArmourKind = new LightArmour();

describe("LightArmour", () => {
  it("is called light armour and is body armour", () => {
    expect([KIND.label, KIND.isBody, KIND.isShield]).toEqual(["light armour", true, false]);
  });

  it.each([-3, 0, 2, 3, 5])("has all of a dexterity modifier of %s", (modifier) => {
    expect(KIND.dexterityPart(modifier)).toBe(modifier);
  });
});
