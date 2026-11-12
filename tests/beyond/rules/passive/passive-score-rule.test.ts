import { describe, expect, it } from "vitest";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { classOf, madeUpRuleCharacter, modifierOf, numberNamed, scoresOf } from "../../builders/made-up-rule-character";
import type { RuleCharacter } from "../../../../src/beyond/rules/input/rule-character";

function passive(name: string, changes: Partial<RuleCharacter>) {
  const value = numberNamed(madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10)], ...changes }), name);
  return { value: value.valueOr(-99), working: value.explanation, isKnown: value.isKnown };
}

describe("PassiveScoreRule", () => {
  it("is 10 plus the skill", () => {
    expect(passive("Passive Perception", { baseScores: scoresOf(10, 10, 10, 10, 14, 10) })).toEqual({ value: 12, working: "10 + Perception 2 = 12", isKnown: true });
  });

  it("includes the proficiency in the skill", () => {
    expect(passive("Passive Perception", { baseScores: scoresOf(10, 10, 10, 10, 14, 10), modifiers: [modifierOf("proficiency", "perception", null, "Class")] }).value).toBe(15);
  });

  it("works out investigation from intelligence", () => {
    expect(passive("Passive Investigation", { baseScores: scoresOf(10, 10, 10, 14, 10, 10) }).value).toBe(12);
  });

  it("works out insight from wisdom", () => {
    expect(passive("Passive Insight", { baseScores: scoresOf(10, 10, 10, 10, 8, 10) }).value).toBe(9);
  });

  it("adds a passive bonus modifier and shows its source", () => {
    const observant = modifierOf("bonus", "passive-perception", 5, "Observant");
    expect(passive("Passive Perception", { modifiers: [observant] })).toEqual({ value: 15, working: "10 + Perception 0 + Observant 5 = 15", isKnown: true });
  });

  it("leaves the other passives out of a perception bonus", () => {
    expect(passive("Passive Insight", { modifiers: [modifierOf("bonus", "passive-perception", 5, "Observant")] }).value).toBe(10);
  });

  it("lists a restricted passive bonus and does not apply it", () => {
    const sentinel = modifierOf("bonus", "passive-perception", 5, "Sentinel", "while awake");
    expect(passive("Passive Perception", { modifiers: [sentinel] }).working).toBe("10 + Perception 0 = 10. Plus conditional bonuses I don't apply: Sentinel");
  });

  it("does not know a passive when its modifier is one it does not know", () => {
    expect(passive("Passive Perception", { modifiers: [modifierOf("set", "passive-perception", 20, "Pale Charm")] }).isKnown).toBe(false);
  });

  it("does not know a passive when the skill is not known, and says which", () => {
    const value = numberNamed(madeUpRuleCharacter({ baseScores: new AbilityTable<number>() }), "Passive Perception");
    expect(value.explanation).toBe("It needs Perception, which is not known: It needs WIS modifier, which is not known: It needs WIS, which is not known: Wisdom is missing a base score or its bonus.");
  });
});
