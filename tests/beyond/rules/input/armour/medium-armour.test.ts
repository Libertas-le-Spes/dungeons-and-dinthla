import { describe, expect, it } from "vitest";
import type { ArmourKind } from "../../../../../src/beyond/rules/input/armour/armour-kind";
import { MediumArmour } from "../../../../../src/beyond/rules/input/armour/medium-armour";

const KIND: ArmourKind = new MediumArmour();

describe("MediumArmour", () => {
  it("is called medium armour and is body armour", () => {
    expect([KIND.label, KIND.isBody, KIND.isShield]).toEqual(["medium armour", true, false]);
  });

  it.each([
    { modifier: -3, part: -3 },
    { modifier: 0, part: 0 },
    { modifier: 2, part: 2 },
    { modifier: 3, part: 2 },
    { modifier: 5, part: 2 },
  ])("has $part of a dexterity modifier of $modifier", ({ modifier, part }) => {
    expect(KIND.dexterityPart(modifier)).toBe(part);
  });
});
