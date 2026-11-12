import { describe, expect, it } from "vitest";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { madeUpRuleCharacter, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

describe("AbilityModifierRule", () => {
  it.each([
    { score: 1, modifier: -5 },
    { score: 8, modifier: -1 },
    { score: 9, modifier: -1 },
    { score: 10, modifier: 0 },
    { score: 11, modifier: 0 },
    { score: 12, modifier: 1 },
    { score: 20, modifier: 5 },
    { score: 30, modifier: 10 },
  ])("gives a modifier of $modifier for a score of $score", ({ score, modifier }) => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(score, 10, 10, 10, 10, 10) });
    expect(numberNamed(character, "STR modifier").valueOr(-99)).toBe(modifier);
  });

  it("shows the sum it worked", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(11, 10, 10, 10, 10, 10) });
    expect(numberNamed(character, "STR modifier").explanation).toBe("floor((11 - 10) / 2) = 0");
  });

  it("does not know a modifier whose score is not known, and says which score", () => {
    const character = madeUpRuleCharacter({ baseScores: new AbilityTable<number>() });
    const modifier = numberNamed(character, "STR modifier");
    expect([modifier.isKnown, modifier.explanation]).toEqual([false, "It needs STR, which is not known: Strength is missing a base score or its bonus."]);
  });
});
