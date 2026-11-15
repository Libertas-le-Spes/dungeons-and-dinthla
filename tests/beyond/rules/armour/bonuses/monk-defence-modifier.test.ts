import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, modifierOf, scoresOf } from "../../../builders/made-up-rule-character";
import { numberNamed } from "../../../builders/rule-numbers";
import { armourClassOf } from "../../../builders/rule-test-helpers";

const WISE = scoresOf(10, 18, 10, 10, 14, 10);

describe("MonkDefenceModifier", () => {
  it("lets a monk's own Unarmored Defense modifier pass, so the monk's formula gives the armor class", () => {
    const character = { classes: [classOf("Monk", 1, 8)], baseScores: WISE, modifiers: [modifierOf("set", "unarmored-armor-class", null, "Unarmored Defense")] };
    expect(armourClassOf(character)).toEqual({ value: 16, working: "10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence" });
  });

  it("matches the source name without regard to case or spaces around it", () => {
    const character = { classes: [classOf("Monk", 1, 8)], baseScores: WISE, modifiers: [modifierOf("set", "unarmored-armor-class", null, " unarmored defense ")] };
    expect(armourClassOf(character).value).toBe(16);
  });

  it("does not let it pass for a character who is not a monk", () => {
    const character = madeUpRuleCharacter({ modifiers: [modifierOf("set", "unarmored-armor-class", null, "Unarmored Defense")] });
    expect(numberNamed(character, "AC").explanation).toContain('"unarmored-armor-class"');
  });

  it("does not let another source's set modifier pass for a monk", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], modifiers: [modifierOf("set", "unarmored-armor-class", 20, "Pale Charm")] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });

  it("does not let a bonus with the same source name pass", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], baseScores: WISE, modifiers: [modifierOf("bonus", "unarmored-armor-class", 2, "Unarmored Defense")] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });

  it("does not let a set modifier for another sub-type pass", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], baseScores: WISE, modifiers: [modifierOf("set", "armored-armor-class", 2, "Unarmored Defense")] });
    expect(numberNamed(character, "AC").isKnown).toBe(false);
  });
});
