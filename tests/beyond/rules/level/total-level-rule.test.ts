import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

describe("TotalLevelRule", () => {
  it("adds the levels of every class and shows each", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 3, 10), classOf("Wizard", 2, 6)] });
    const level = numberNamed(character, "Total level");
    expect([level.valueOr(-1), level.explanation]).toEqual([5, "Fighter 3 + Wizard 2 = 5"]);
  });

  it("does not know the level of a character with no class", () => {
    const level = numberNamed(madeUpRuleCharacter({ classes: [] }), "Total level");
    expect([level.isKnown, level.explanation]).toEqual([false, "The character has no class."]);
  });

  it.each([
    { level: 1, known: true },
    { level: 20, known: true },
    { level: 0, known: false },
    { level: 21, known: false },
    { level: 1.5, known: false },
  ])("knows a class level of $level: $known", ({ level, known }) => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", level, 10)] });
    expect(numberNamed(character, "Total level").isKnown).toBe(known);
  });

  it("knows two classes at level 20 together, forty in all", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 20, 10), classOf("Wizard", 20, 6)] });
    expect(numberNamed(character, "Total level").valueOr(-1)).toBe(40);
  });

  it("does not know forty-one levels in all", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 20, 10), classOf("Wizard", 20, 6), classOf("Rogue", 1, 8)] });
    expect(numberNamed(character, "Total level").isKnown).toBe(false);
  });
});
