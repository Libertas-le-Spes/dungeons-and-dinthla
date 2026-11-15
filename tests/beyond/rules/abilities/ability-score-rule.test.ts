import { describe, expect, it } from "vitest";
import type { Ability } from "../../../../src/beyond/rules/input/ability";
import type { RuleCharacter } from "../../../../src/beyond/rules/input/rule-character";
import { ABILITIES, CHARISMA, DEXTERITY, STRENGTH } from "../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { madeUpRuleCharacter, modifierOf, noBonuses, scoresOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

function isNot(ability: Ability): (other: Ability) => boolean {
  return function isOther(other: Ability): boolean {
    return other !== ability;
  };
}

function valueIn(character: RuleCharacter): (ability: Ability) => number {
  return function valueOfAbility(ability: Ability): number {
    return numberNamed(character, ability.short).valueOr(-1);
  };
}

describe("AbilityScoreRule", () => {
  it("adds the bonus score to the base score and shows both", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(15, 10, 10, 10, 10, 10), bonusScores: scoresOf(2, 0, 0, 0, 0, 0) });
    const strength = numberNamed(character, "STR");
    expect([strength.valueOr(-1), strength.explanation]).toEqual([17, "base 15 + bonus 2 = 17"]);
  });

  it("takes a score set on D&D Beyond over the base and the bonus", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(8, 8, 8, 8, 8, 8), scoreOverrides: new AbilityTable<number>().with(CHARISMA, 20) });
    const charisma = numberNamed(character, "CHA");
    expect([charisma.valueOr(-1), charisma.explanation]).toEqual([20, "Set by hand"]);
  });

  it.each(ABILITIES)("works out $label from its own base score only", (ability) => {
    const only = new AbilityTable<number>();
    for (const other of ABILITIES) only.with(other, 10);
    only.with(ability, 14);
    const character = madeUpRuleCharacter({ baseScores: only });
    expect(numberNamed(character, ability.short).valueOr(-1)).toBe(14);
  });

  it.each(ABILITIES)("leaves the other five alone when only $label has a bonus", (ability) => {
    const bonuses = new AbilityTable<number>();
    for (const other of ABILITIES) bonuses.with(other, 0);
    bonuses.with(ability, 4);
    const character = madeUpRuleCharacter({ bonusScores: bonuses });
    const others = ABILITIES.filter(isNot(ability));
    expect(others.map(valueIn(character))).toEqual([10, 10, 10, 10, 10]);
  });

  it("adds a plain score bonus from a modifier that applies now", () => {
    const character = madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "dexterity-score", 2, "Gloves")] });
    const dexterity = numberNamed(character, "DEX");
    expect([dexterity.valueOr(-1), dexterity.explanation]).toEqual([12, "base 10 + bonus 0 + Gloves 2 = 12"]);
  });

  it("leaves out a score bonus whose item is not worn", () => {
    const character = madeUpRuleCharacter({ modifiers: [{ ...modifierOf("bonus", "dexterity-score", 2, "Gloves"), inForce: false }] });
    expect(numberNamed(character, "DEX").valueOr(-1)).toBe(10);
  });

  it("does not know a score a modifier of a kind it does not know changes, and names the modifier", () => {
    const character = madeUpRuleCharacter({ modifiers: [modifierOf("set-base", "strength-score", 19, "Gauntlets")] });
    const strength = numberNamed(character, "STR");
    expect([strength.isKnown, strength.explanation]).toEqual([false, 'Unread rule "strength-score".']);
  });

  it("does not know a score when the base score is missing, and leaves the others standing", () => {
    const character = madeUpRuleCharacter({ baseScores: new AbilityTable<number>().with(DEXTERITY, 12) });
    expect([numberNamed(character, "STR").isKnown, numberNamed(character, "DEX").isKnown]).toEqual([false, true]);
  });

  it("does not know a score when its bonus is missing", () => {
    const character = madeUpRuleCharacter({ bonusScores: new AbilityTable<number>().with(DEXTERITY, 0) });
    expect([numberNamed(character, "STR").isKnown, numberNamed(character, "DEX").isKnown]).toEqual([false, true]);
  });

  it.each([
    { total: 1, known: true },
    { total: 20, known: true },
    { total: 0, known: false },
    { total: 21, known: false },
  ])("knows a score of $total: $known", ({ total, known }) => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(total, 10, 10, 10, 10, 10) });
    expect(numberNamed(character, "STR").isKnown).toBe(known);
  });

  it.each([
    { override: 1, known: true },
    { override: 30, known: true },
    { override: 31, known: false },
  ])("knows a score set on D&D Beyond to $override: $known", ({ override, known }) => {
    const character = madeUpRuleCharacter({ scoreOverrides: new AbilityTable<number>().with(STRENGTH, override), bonusScores: noBonuses() });
    expect(numberNamed(character, "STR").isKnown).toBe(known);
  });
});

describe("AbilityScoreRule and the size of a score modifier", () => {
  it("does not use a score bonus of 31, and names it", () => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "dexterity-score", 31, "Gloves")] }), "DEX");
    expect(value.explanation).toBe('Unread rule "dexterity-score".');
  });

  it("does not use a huge score bonus", () => {
    expect(numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "dexterity-score", 1e300, "Gloves")] }), "DEX").isKnown).toBe(false);
  });

  it("uses a score bonus of 2", () => {
    expect(numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "dexterity-score", 2, "Gloves")] }), "DEX").valueOr(-1)).toBe(12);
  });
});
