import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../src/beyond/rules/input/armour/heavy-armour";
import { LightArmour } from "../../../../src/beyond/rules/input/armour/light-armour";
import { itemOf, madeUpRuleCharacter, modifierOf, scoresOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";
import type { RuleCharacter } from "../../../../src/beyond/rules/input/rule-character";

function speedOf(changes: Partial<RuleCharacter>) {
  const value = numberNamed(madeUpRuleCharacter(changes), "Speed");
  return { value: value.valueOr(-1), working: value.explanation, isKnown: value.isKnown };
}

describe("SpeedRule", () => {
  it("is the walking speed the species states", () => {
    expect(speedOf({ walkingSpeed: 25 })).toEqual({ value: 25, working: "walking 25 = 25", isKnown: true });
  });

  it("adds a plain speed bonus and shows its source", () => {
    expect(speedOf({ modifiers: [modifierOf("bonus", "speed", 10, "Pale Boots")] })).toEqual({ value: 40, working: "walking 30 + Pale Boots 10 = 40", isKnown: true });
  });

  it("does not know speed with the monk's unarmored movement, and names it", () => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "unarmored-movement", 10, "Monk")] }), "Speed");
    expect([value.isKnown, value.explanation]).toEqual([false, 'D&D Beyond names a rule I can\'t work out here: "unarmored-movement". Type it on your note to set it.']);
  });

  it("does not know speed when the walking speed is missing", () => {
    expect(speedOf({ walkingSpeed: null }).isKnown).toBe(false);
  });

  it("does not know speed in armour that needs more strength than the character has", () => {
    const heavy = { ...itemOf("Plate", new HeavyArmour(), 18), strengthRequired: 15 };
    expect(numberNamed(madeUpRuleCharacter({ items: [heavy] }), "Speed").explanation).toBe("Plate needs Strength 15, and it is more than 10, or the need is not a number. I don't work out what that does to speed.");
  });

  it("knows speed in armour when the strength is exactly the requirement", () => {
    const heavy = { ...itemOf("Plate", new HeavyArmour(), 18), strengthRequired: 15 };
    expect(speedOf({ items: [heavy], baseScores: scoresOf(15, 10, 10, 10, 10, 10) }).value).toBe(30);
  });

  it("does not look at armour that needs no strength", () => {
    expect(speedOf({ items: [itemOf("Leather", new LightArmour(), 11)] }).value).toBe(30);
  });

  it("does not know speed when strength is not known", () => {
    expect(speedOf({ baseScores: scoresOf(0, 10, 10, 10, 10, 10) }).isKnown).toBe(false);
  });

  it.each([
    { speed: 0, known: true },
    { speed: 500, known: true },
    { speed: 501, known: false },
    { speed: -1, known: false },
  ])("knows a speed of $speed: $known", ({ speed, known }) => {
    expect(speedOf({ walkingSpeed: speed }).isKnown).toBe(known);
  });
});

describe("SpeedRule and a strength need that is not a number", () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("does not know speed in armour that needs %s strength", (needed) => {
    const odd = { ...itemOf("Plate", new HeavyArmour(), 18), strengthRequired: needed };
    expect(numberNamed(madeUpRuleCharacter({ items: [odd] }), "Speed").isKnown).toBe(false);
  });
});

describe("SpeedRule and the kinds of movement a modifier names", () => {
  it.each(["speed-walking", "speed-flying", "movement-bonus", "innate-speed-walking"])("does not know speed with a modifier on %s, and names it", (subType) => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", subType, 10, "Pale Boots")] }), "Speed");
    expect([value.isKnown, value.explanation]).toEqual([false, `D&D Beyond names a rule I can't work out here: "${subType}". Type it on your note to set it.`]);
  });

  it.each(["innate-speed-flying", "innate-speed-swimming", "innate-speed-climbing", "innate-speed-burrowing"])("leaves the walking speed alone for a modifier that sets %s", (subType) => {
    expect(speedOf({ modifiers: [modifierOf("set", subType, 60, "Wings")] })).toEqual({ value: 30, working: "walking 30 = 30", isKnown: true });
  });
});
