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

  it("knows twenty levels in all across classes", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 12, 10), classOf("Wizard", 8, 6)] });
    expect(numberNamed(character, "Total level").valueOr(-1)).toBe(20);
  });

  it("does not know twenty-one levels in all, because 5e stops at 20", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 12, 10), classOf("Wizard", 9, 6)] });
    expect(numberNamed(character, "Total level").explanation).toBe("The character level has to be a whole number from 1 to 20.");
  });

  it.each([
    { first: "Wizard", second: "Wizard", firstLevel: 10, secondLevel: 10 },
    { first: "Warlock", second: "Warlock", firstLevel: 2, secondLevel: 10 },
  ])("does not know the level when $first is listed twice", ({ first, second, firstLevel, secondLevel }) => {
    const character = madeUpRuleCharacter({ classes: [classOf(first, firstLevel, 6), classOf(second, secondLevel, 6)] });
    expect(numberNamed(character, "Total level").explanation).toBe(`The class ${first} is listed more than once.`);
  });

  it("names classes apart by their text, so two different classes are fine", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6), classOf("Warlock", 5, 8)] });
    expect(numberNamed(character, "Total level").valueOr(-1)).toBe(10);
  });
});
