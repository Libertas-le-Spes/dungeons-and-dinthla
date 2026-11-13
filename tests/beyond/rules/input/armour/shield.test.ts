import { describe, expect, it } from "vitest";
import type { ArmourKind } from "../../../../../src/beyond/rules/input/armour/armour-kind";
import { Shield } from "../../../../../src/beyond/rules/input/armour/shield";

const KIND: ArmourKind = new Shield();

describe("Shield", () => {
  it("is called shield and is a shield", () => {
    expect([KIND.label, KIND.isBody, KIND.isShield]).toEqual(["shield", false, true]);
  });

  it("has no part of a dexterity modifier", () => {
    expect(KIND.dexterityPart(4)).toBe(0);
  });
});
