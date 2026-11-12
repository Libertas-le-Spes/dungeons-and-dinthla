import { describe, expect, it } from "vitest";
import { ABILITIES } from "../../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../../src/beyond/rules/input/by-ability";
import { classOf, madeUpRuleCharacter, modifierOf } from "../../../builders/made-up-rule-character";
import { numberNamed } from "../../../builders/rule-numbers";
import { onlyAbilityRaised } from "../../../builders/rule-test-helpers";
import type { RuleCharacter } from "../../../../../src/beyond/rules/input/rule-character";

const LEVEL_FIVE = [classOf("Fighter", 5, 10)];

function saveValue(name: string, changes: Partial<RuleCharacter>) {
  const value = numberNamed(madeUpRuleCharacter({ classes: LEVEL_FIVE, ...changes }), name);
  return { value: value.valueOr(-99), working: value.explanation, isKnown: value.isKnown };
}

describe("SavingThrowRule", () => {
  it.each(ABILITIES)("is the $label modifier alone without proficiency", (ability) => {
    expect(saveValue(`${ability.short} save`, { baseScores: onlyAbilityRaised(ability.short) })).toEqual({ value: 2, working: `${ability.short} 2 = 2`, isKnown: true });
  });

  it.each(ABILITIES)("adds the proficiency bonus when a proficiency names the $label save", (ability) => {
    const proficient = modifierOf("proficiency", `${ability.label.toLowerCase()}-saving-throws`, null, "Class");
    expect(saveValue(`${ability.short} save`, { baseScores: onlyAbilityRaised(ability.short), modifiers: [proficient] })).toEqual({ value: 5, working: `${ability.short} 2 + proficiency 3 = 5`, isKnown: true });
  });

  it("leaves the other saves without the proficiency", () => {
    const proficient = modifierOf("proficiency", "strength-saving-throws", null, "Class");
    expect(saveValue("DEX save", { modifiers: [proficient] }).value).toBe(0);
  });

  it("does not give Jack of All Trades to a save", () => {
    expect(saveValue("DEX save", { features: ["Jack of All Trades"] }).value).toBe(0);
  });

  it("adds a bonus to every save from one modifier", () => {
    const cloak = modifierOf("bonus", "saving-throws", 1, "Cloak");
    expect([saveValue("STR save", { modifiers: [cloak] }).value, saveValue("CHA save", { modifiers: [cloak] }).working]).toEqual([1, "CHA 0 + Cloak 1 = 1"]);
  });

  it("lists a restricted bonus and does not apply it", () => {
    const aura = modifierOf("bonus", "saving-throws", 2, "Aura", "within 10 feet of the paladin");
    expect(saveValue("STR save", { modifiers: [aura] })).toEqual({ value: 0, working: "STR 0 = 0. Plus conditional bonuses I don't apply: Aura", isKnown: true });
  });

  it("does not know one save whose modifier it does not know and leaves the others standing", () => {
    const character = { modifiers: [modifierOf("set", "wisdom-saving-throws", 20, "Pale Charm")] };
    expect([saveValue("WIS save", character).isKnown, saveValue("STR save", character).isKnown]).toEqual([false, true]);
  });

  it("does not know a save when its ability modifier is not known", () => {
    expect(saveValue("STR save", { baseScores: new AbilityTable<number>() }).isKnown).toBe(false);
  });
});

describe("SavingThrowRule and a modifier it does not know that covers every save", () => {
  it("does not know any save", () => {
    const character = { modifiers: [modifierOf("set", "saving-throws", 20, "Pale Charm")] };
    expect([saveValue("STR save", character).isKnown, saveValue("CHA save", character).isKnown]).toEqual([false, false]);
  });
});
