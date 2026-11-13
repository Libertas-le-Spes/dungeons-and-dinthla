import { describe, expect, it } from "vitest";
import { AbilityTable } from "../../../../../src/beyond/rules/input/by-ability";
import { SKILLS } from "../../../../../src/beyond/rules/proficiency/skills/skills";
import { classOf, madeUpRuleCharacter, modifierOf, scoresOf } from "../../../builders/made-up-rule-character";
import { numberNamed } from "../../../builders/rule-numbers";
import { onlyAbilityRaised } from "../../../builders/rule-test-helpers";
import type { RuleCharacter } from "../../../../../src/beyond/rules/input/rule-character";

const LEVEL_FIVE = [classOf("Fighter", 5, 10)];

function skillValue(skillName: string, changes: Partial<RuleCharacter>) {
  const value = numberNamed(madeUpRuleCharacter({ classes: LEVEL_FIVE, ...changes }), skillName);
  return { value: value.valueOr(-99), working: value.explanation, isKnown: value.isKnown };
}

describe("SkillRule for each of the 18 skills", () => {
  it("has eighteen skills", () => {
    expect(SKILLS).toHaveLength(18);
  });

  it.each(SKILLS)("uses the ability of $name and adds nothing without proficiency", (skill) => {
    expect(skillValue(skill.name, { baseScores: onlyAbilityRaised(skill.ability.short) }).value).toBe(2);
  });

  it.each(SKILLS)("adds the proficiency bonus to $name with proficiency", (skill) => {
    const proficient = modifierOf("proficiency", skill.subType, null, "Class");
    expect(skillValue(skill.name, { baseScores: onlyAbilityRaised(skill.ability.short), modifiers: [proficient] })).toEqual({ value: 5, working: `${skill.ability.short} 2 + proficiency 3 = 5`, isKnown: true });
  });

  it.each(SKILLS)("doubles the proficiency bonus for $name with expertise", (skill) => {
    const expert = [modifierOf("proficiency", skill.subType, null, "Class"), modifierOf("expertise", skill.subType, null, "Class")];
    expect(skillValue(skill.name, { baseScores: onlyAbilityRaised(skill.ability.short), modifiers: expert })).toEqual({ value: 8, working: `${skill.ability.short} 2 + expertise 6 = 8`, isKnown: true });
  });

  it.each(SKILLS)("adds half the proficiency bonus, rounded down, to $name for Jack of All Trades", (skill) => {
    expect(skillValue(skill.name, { baseScores: onlyAbilityRaised(skill.ability.short), features: ["Jack of All Trades"] })).toEqual({ value: 3, working: `${skill.ability.short} 2 + half proficiency 1 = 3`, isKnown: true });
  });
});

describe("SkillRule proficiency levels", () => {
  const acrobatics = "Acrobatics";

  it("gives full proficiency, not half, to a skill that has both", () => {
    const character = { features: ["Jack of All Trades"], modifiers: [modifierOf("proficiency", "acrobatics", null, "Class")] };
    expect(skillValue(acrobatics, character).value).toBe(3);
  });

  it("gives expertise on its own the doubled bonus", () => {
    expect(skillValue(acrobatics, { modifiers: [modifierOf("expertise", "acrobatics", null, "Class")] }).value).toBe(6);
  });

  it("ignores a proficiency whose source does not apply now", () => {
    const unworn = { ...modifierOf("proficiency", "acrobatics", null, "Hat"), inForce: false };
    expect(skillValue(acrobatics, { modifiers: [unworn] }).value).toBe(0);
  });

  it("rounds half of a proficiency bonus of 2 down to 1", () => {
    const character = madeUpRuleCharacter({ features: ["Jack of All Trades"] });
    expect(numberNamed(character, "Acrobatics").valueOr(-1)).toBe(1);
  });

  it("gives half of a proficiency bonus of 6 at level 17 as 3", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 17, 10)], features: ["Jack of All Trades"] });
    expect(numberNamed(character, "Acrobatics").valueOr(-1)).toBe(3);
  });

  it("counts the modifier of a negative ability", () => {
    expect(skillValue(acrobatics, { baseScores: scoresOf(10, 8, 10, 10, 10, 10) }).value).toBe(-1);
  });
});

describe("SkillRule modifiers", () => {
  it("adds a plain bonus to one skill and shows its source", () => {
    const boots = modifierOf("bonus", "stealth", 2, "Boots");
    expect(skillValue("Stealth", { modifiers: [boots] })).toEqual({ value: 2, working: "DEX 0 + Boots 2 = 2", isKnown: true });
  });

  it("leaves another skill alone", () => {
    expect(skillValue("Acrobatics", { modifiers: [modifierOf("bonus", "stealth", 2, "Boots")] }).value).toBe(0);
  });

  it("lists a bonus with a restriction and does not apply it", () => {
    const hood = modifierOf("bonus", "stealth", 2, "Hood", "in dim light");
    expect(skillValue("Stealth", { modifiers: [hood] })).toEqual({ value: 0, working: "DEX 0 = 0. Plus conditional bonuses I don't apply: Hood", isKnown: true });
  });

  it("does not change the number for advantage or disadvantage", () => {
    expect(skillValue("Stealth", { modifiers: [modifierOf("advantage", "stealth", null, "Cloak"), modifierOf("disadvantage", "stealth", null, "Armour")] }).value).toBe(0);
  });

  it("does not know one skill whose modifier it does not know and leaves the others standing", () => {
    const character = { modifiers: [modifierOf("set", "stealth", 20, "Pale Charm")] };
    expect([skillValue("Stealth", character).isKnown, skillValue("Acrobatics", character).isKnown]).toEqual([false, true]);
  });

  it("does not know a skill when the ability modifier is not known", () => {
    expect(skillValue("Stealth", { baseScores: new AbilityTable<number>() }).isKnown).toBe(false);
  });

  it("does not know a skill when the proficiency bonus is not known", () => {
    expect(skillValue("Stealth", { classes: [] }).isKnown).toBe(false);
  });
});

describe("SkillRule and modifiers that cover every skill", () => {
  it("adds a plain ability checks bonus to a skill and shows its source", () => {
    expect(skillValue("Stealth", { modifiers: [modifierOf("bonus", "ability-checks", 1, "Pale Charm")] })).toEqual({ value: 1, working: "DEX 0 + Pale Charm 1 = 1", isKnown: true });
  });

  it("adds a plain skill checks bonus to a skill", () => {
    expect(skillValue("Arcana", { modifiers: [modifierOf("bonus", "skill-checks", 2, "Pale Charm")] }).value).toBe(2);
  });

  it("does not know a skill when an ability checks modifier is one it does not know", () => {
    expect(skillValue("Stealth", { modifiers: [modifierOf("set", "ability-checks", 20, "Pale Charm")] }).isKnown).toBe(false);
  });
});
