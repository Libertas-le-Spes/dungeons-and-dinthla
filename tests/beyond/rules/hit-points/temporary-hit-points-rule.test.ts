import { describe, expect, it } from "vitest";
import { madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

describe("TemporaryHitPointsRule", () => {
  it("shows the temporary hit points on their own", () => {
    const temporary = numberNamed(madeUpRuleCharacter({ temporaryHitPoints: 5, baseHitPoints: 14 }), "Temporary HP");
    expect([temporary.valueOr(-1), temporary.explanation, numberNamed(madeUpRuleCharacter({ temporaryHitPoints: 5, baseHitPoints: 14 }), "Current HP").valueOr(-1)]).toEqual([5, "Temporary hit points on D&D Beyond: 5", 14]);
  });

  it.each([
    { temporary: 0, known: true },
    { temporary: 9_999, known: true },
    { temporary: 10_000, known: false },
    { temporary: -1, known: false },
  ])("knows $temporary temporary hit points: $known", ({ temporary, known }) => {
    expect(numberNamed(madeUpRuleCharacter({ temporaryHitPoints: temporary }), "Temporary HP").isKnown).toBe(known);
  });

  it("does not know them when they are missing", () => {
    expect(numberNamed(madeUpRuleCharacter({ temporaryHitPoints: null }), "Temporary HP").isKnown).toBe(false);
  });
});
