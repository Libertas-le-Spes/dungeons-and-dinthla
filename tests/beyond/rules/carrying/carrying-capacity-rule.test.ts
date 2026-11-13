import { describe, expect, it } from "vitest";
import { madeUpRuleCharacter, scoresOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

describe("CarryingCapacityRule", () => {
  it.each([
    { strength: 1, capacity: 15 },
    { strength: 10, capacity: 150 },
    { strength: 11, capacity: 165 },
    { strength: 30, capacity: 450 },
  ])("is 15 times a strength of $strength: $capacity", ({ strength, capacity }) => {
    expect(numberNamed(madeUpRuleCharacter({ baseScores: scoresOf(strength, 10, 10, 10, 10, 10) }), "Carrying capacity").valueOr(-1)).toBe(capacity);
  });

  it("shows the working", () => {
    expect(numberNamed(madeUpRuleCharacter({}), "Carrying capacity").explanation).toBe("15 x STR 10 = 150");
  });

  it("does not know it when strength is not known", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseScores: scoresOf(0, 10, 10, 10, 10, 10) }), "Carrying capacity").isKnown).toBe(false);
  });
});
