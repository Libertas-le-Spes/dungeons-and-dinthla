import { describe, expect, it } from "vitest";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { classOf, madeUpRuleCharacter, modifierOf, numberNamed, withDexterity } from "../../builders/made-up-rule-character";
import type { RuleCharacter } from "../../../../src/beyond/rules/input/rule-character";

function initiative(changes: Partial<RuleCharacter>) {
  const value = numberNamed(madeUpRuleCharacter(changes), "Initiative");
  return { value: value.valueOr(-99), working: value.explanation, isKnown: value.isKnown };
}

describe("InitiativeRule", () => {
  it("is the dexterity modifier", () => {
    expect(initiative({ baseScores: withDexterity(16) })).toEqual({ value: 3, working: "DEX 3 = 3", isKnown: true });
  });

  it("counts a negative dexterity modifier", () => {
    expect(initiative({ baseScores: withDexterity(8) }).value).toBe(-1);
  });

  it("adds an initiative bonus and shows its source", () => {
    expect(initiative({ modifiers: [modifierOf("bonus", "initiative", 2, "Charm")] })).toEqual({ value: 2, working: "DEX 0 + Charm 2 = 2", isKnown: true });
  });

  it("adds half the proficiency bonus, rounded down, for Jack of All Trades", () => {
    expect(initiative({ classes: [classOf("Bard", 5, 8)], features: ["Jack of All Trades"] }).value).toBe(1);
  });

  it("does not add the proficiency bonus itself", () => {
    expect(initiative({ classes: [classOf("Bard", 5, 8)], modifiers: [modifierOf("proficiency", "initiative", null, "Class")] }).value).toBe(3);
  });

  it("does not know initiative with the Alert feat, whatever the edition", () => {
    const value = numberNamed(madeUpRuleCharacter({ features: ["Alert"] }), "Initiative");
    expect([value.isKnown, value.explanation]).toEqual([false, "Alert may change this value and is not worked out here."]);
  });

  it("does not know initiative with a modifier it does not know", () => {
    expect(initiative({ modifiers: [modifierOf("set", "initiative", 20, "Pale Charm")] }).isKnown).toBe(false);
  });

  it("does not know initiative when the dexterity modifier is not known", () => {
    expect(initiative({ baseScores: new AbilityTable<number>() }).isKnown).toBe(false);
  });
});
