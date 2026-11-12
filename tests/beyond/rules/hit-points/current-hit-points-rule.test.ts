import { describe, expect, it } from "vitest";
import { madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

describe("CurrentHitPointsRule", () => {
  it("takes the hit points lost off the maximum and shows both", () => {
    const character = madeUpRuleCharacter({ baseHitPoints: 14, removedHitPoints: 4 });
    const current = numberNamed(character, "Current HP");
    expect([current.valueOr(-1), current.explanation]).toEqual([10, "14 - 4 lost = 10"]);
  });

  it("is the whole maximum when nothing is lost", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseHitPoints: 14 }), "Current HP").valueOr(-1)).toBe(14);
  });

  it("is zero when all are lost", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseHitPoints: 14, removedHitPoints: 14 }), "Current HP").valueOr(-1)).toBe(0);
  });

  it("does not know the hit points when more are lost than the maximum", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseHitPoints: 14, removedHitPoints: 15 }), "Current HP").isKnown).toBe(false);
  });

  it("does not know the hit points when the number lost is missing", () => {
    expect(numberNamed(madeUpRuleCharacter({ removedHitPoints: null }), "Current HP").isKnown).toBe(false);
  });

  it("does not know the hit points when the maximum is not known, and says so", () => {
    const current = numberNamed(madeUpRuleCharacter({ baseHitPoints: null }), "Current HP");
    expect(current.explanation).toBe("It needs HP, which is not known.");
  });
});
