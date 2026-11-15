import { describe, expect, it } from "vitest";
import type { RuleModifier } from "../../../../../src/beyond/rules/input/rule-modifier";
import { classOf, madeUpRuleCharacter, modifierOf, scoresOf } from "../../../builders/made-up-rule-character";
import { numberNamed } from "../../../builders/rule-numbers";
import { armourClassOf } from "../../../builders/rule-test-helpers";

const SCORES = scoresOf(10, 18, 16, 10, 14, 10);

function defence(ability: string, source: string): RuleModifier {
  return { ...modifierOf("set", "unarmored-armor-class", null, source), ability };
}

describe("OwnDefenceModifier", () => {
  it("lets a monk's own Unarmored Defense modifier, on wisdom, pass, so the monk's formula gives the armor class", () => {
    const character = { classes: [classOf("Monk", 1, 8)], baseScores: SCORES, modifiers: [defence("WIS", "Unarmored Defense")] };
    expect(armourClassOf(character)).toEqual({ value: 16, working: "10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence" });
  });

  it("lets a barbarian's own Unarmored Defense modifier, on constitution, pass", () => {
    const character = { classes: [classOf("Barbarian", 1, 12)], baseScores: SCORES, modifiers: [defence("CON", "Unarmored Defense")] };
    expect(armourClassOf(character)).toEqual({ value: 17, working: "10 + DEX 4 + CON 3 = 17, barbarian's unarmoured defence" });
  });

  it("matches the source name without regard to case or spaces around it", () => {
    const character = { classes: [classOf("Monk", 1, 8)], baseScores: SCORES, modifiers: [defence("WIS", " unarmored defense ")] };
    expect(armourClassOf(character).value).toBe(16);
  });

  it.each([
    ["a monk's modifier on constitution", "Monk", "CON"],
    ["a barbarian's modifier on wisdom", "Barbarian", "WIS"],
    ["a monk's modifier on no ability", "Monk", ""],
  ])("does not let %s pass", (_, className, ability) => {
    const character = madeUpRuleCharacter({ classes: [classOf(className, 1, 8)], baseScores: SCORES, modifiers: [defence(ability, "Unarmored Defense")] });
    expect(numberNamed(character, "AC").explanation).toContain('"unarmored-armor-class"');
  });

  it("does not let it pass for a character who has neither class", () => {
    const character = madeUpRuleCharacter({ modifiers: [defence("WIS", "Unarmored Defense")] });
    expect(numberNamed(character, "AC").explanation).toContain('"unarmored-armor-class"');
  });

  it("does not let another source's set modifier pass for a monk", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], modifiers: [defence("WIS", "Pale Charm")] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });

  it("does not let a bonus with the same source name pass", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], baseScores: SCORES, modifiers: [{ ...modifierOf("bonus", "unarmored-armor-class", 2, "Unarmored Defense"), ability: "WIS" }] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });

  it("does not let a set modifier for another sub-type pass", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], baseScores: SCORES, modifiers: [{ ...modifierOf("set", "armored-armor-class", 2, "Unarmored Defense"), ability: "WIS" }] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });
});
