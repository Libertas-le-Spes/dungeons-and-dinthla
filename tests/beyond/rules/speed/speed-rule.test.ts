import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../src/beyond/rules/input/armour/heavy-armour";
import { LightArmour } from "../../../../src/beyond/rules/input/armour/light-armour";
import { itemOf, madeUpRuleCharacter, modifierOf, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

function speedOf(changes: Parameters<typeof madeUpRuleCharacter>[0]) {
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
    expect(numberNamed(madeUpRuleCharacter({ items: [heavy] }), "Speed").explanation).toBe("Plate needs Strength 15, and it is more than 10. I don't work out what that does to speed.");
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
