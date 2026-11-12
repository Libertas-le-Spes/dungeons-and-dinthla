import { describe, expect, it } from "vitest";
import { ABILITIES, CHARISMA, DEXTERITY, STRENGTH } from "../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { madeUpRuleCharacter, modifierOf, noBonuses, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

describe("AbilityScoreRule", () => {
  it("adds the bonus score to the base score and shows both", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(15, 10, 10, 10, 10, 10), bonusScores: scoresOf(2, 0, 0, 0, 0, 0) });
    const strength = numberNamed(character, "STR");
    expect([strength.valueOr(-1), strength.explanation]).toEqual([17, "base 15 + bonus 2 = 17"]);
  });

  it("takes a score set on D&D Beyond over the base and the bonus", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(8, 8, 8, 8, 8, 8), scoreOverrides: new AbilityTable<number>().with(CHARISMA, 20) });
    const charisma = numberNamed(character, "CHA");
    expect([charisma.valueOr(-1), charisma.explanation]).toEqual([20, "Charisma set on D&D Beyond: 20"]);
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
    const others = ABILITIES.filter((other) => other !== ability);
    expect(others.map((other) => numberNamed(character, other.short).valueOr(-1))).toEqual([10, 10, 10, 10, 10]);
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

  it("does not know a score a modifier sets outright, and names the modifier", () => {
    const character = madeUpRuleCharacter({ modifiers: [modifierOf("set", "strength-score", 19, "Gauntlets")] });
    const strength = numberNamed(character, "STR");
    expect([strength.isKnown, strength.explanation]).toEqual([false, 'D&D Beyond names a rule I can\'t work out here: "strength-score". Type it on your note to set it.']);
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
    { total: 30, known: true },
    { total: 0, known: false },
    { total: 31, known: false },
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
