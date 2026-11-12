import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, numberNamed } from "../../builders/made-up-rule-character";

describe("ProficiencyBonusRule", () => {
  it.each([
    { level: 1, bonus: 2 },
    { level: 4, bonus: 2 },
    { level: 5, bonus: 3 },
    { level: 8, bonus: 3 },
    { level: 9, bonus: 4 },
    { level: 12, bonus: 4 },
    { level: 13, bonus: 5 },
    { level: 16, bonus: 5 },
    { level: 17, bonus: 6 },
    { level: 20, bonus: 6 },
  ])("is $bonus at level $level", ({ level, bonus }) => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", level, 10)] });
    expect(numberNamed(character, "Proficiency bonus").valueOr(-1)).toBe(bonus);
  });

  it("counts every class level together and shows the sum", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 3, 10), classOf("Wizard", 2, 6)] });
    const bonus = numberNamed(character, "Proficiency bonus");
    expect([bonus.valueOr(-1), bonus.explanation]).toEqual([3, "2 + floor((5 - 1) / 4) = 3"]);
  });

  it("is eleven at the highest total level of forty", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 20, 10), classOf("Wizard", 20, 6)] });
    expect(numberNamed(character, "Proficiency bonus").valueOr(-1)).toBe(11);
  });

  it("is not known when the total level is not known", () => {
    const character = madeUpRuleCharacter({ classes: [] });
    expect(numberNamed(character, "Proficiency bonus").explanation).toBe("It needs Total level, which is not known: The character has no class.");
  });
});
