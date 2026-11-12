import { describe, expect, it } from "vitest";
import type { ArmourKind } from "../../../../../src/beyond/rules/input/armour/armour-kind";
import { NotArmour } from "../../../../../src/beyond/rules/input/armour/not-armour";

const KIND: ArmourKind = new NotArmour();

describe("NotArmour", () => {
  it("is called not armour and is neither body armour nor a shield", () => {
    expect([KIND.label, KIND.isBody, KIND.isShield]).toEqual(["not armour", false, false]);
  });

  it("has no part of a dexterity modifier", () => {
    expect(KIND.dexterityPart(4)).toBe(0);
  });
});
