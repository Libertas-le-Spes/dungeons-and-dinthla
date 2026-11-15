import { describe, expect, it } from "vitest";
import { madeUpRuleCharacter, modifierOf, scoresOf } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

function strengthWith(...modifiers: ReturnType<typeof modifierOf>[]) {
  return numberNamed(madeUpRuleCharacter({ baseScores: scoresOf(12, 10, 10, 10, 10, 10), modifiers }), "STR");
}

describe("AbilityScoreRule with a score set by an item", () => {
  it("takes the score the item sets when it is higher, and says so", () => {
    const found = strengthWith(modifierOf("set", "strength-score", 19, "Gauntlets of Ogre Power"));
    expect([found.valueOr(-1), found.explanation]).toEqual([19, "base 12 + bonus 0 = 12, set to 19 by Gauntlets of Ogre Power"]);
  });

  it("keeps the score it has when that is already as high, and says the item has no effect", () => {
    const found = strengthWith(modifierOf("bonus", "strength-score", 8, "Tome"), modifierOf("set", "strength-score", 19, "Gauntlets of Ogre Power"));
    expect([found.valueOr(-1), found.explanation]).toEqual([20, "base 12 + bonus 0 + Tome 8 = 20, set to 19 by Gauntlets of Ogre Power has no effect"]);
  });

  it("takes the highest of several", () => {
    const found = strengthWith(modifierOf("set", "strength-score", 19, "Gauntlets"), modifierOf("set", "strength-score", 21, "Belt"), modifierOf("set", "strength-score", 20, "Ring"));
    expect(found.valueOr(-1)).toBe(21);
  });

  it("leaves another ability alone", () => {
    const found = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("set", "strength-score", 19, "Gauntlets")] }), "DEX");
    expect(found.valueOr(-1)).toBe(10);
  });

  it.each([
    ["a restriction", modifierOf("set", "strength-score", 19, "Gauntlets", "while raging")],
    ["no value", modifierOf("set", "strength-score", null, "Gauntlets")],
    ["a value out of range", modifierOf("set", "strength-score", 31, "Gauntlets")],
    ["a value below range", modifierOf("set", "strength-score", 0, "Gauntlets")],
    ["a value that is not whole", modifierOf("set", "strength-score", 19.5, "Gauntlets")],
  ])("does not know the score for a set modifier with %s", (_, modifier) => {
    expect(strengthWith(modifier).isKnown).toBe(false);
  });

  it("does not use a set modifier that is not in force", () => {
    const off = { ...modifierOf("set", "strength-score", 19, "Gauntlets"), inForce: false };
    expect(strengthWith(off).valueOr(-1)).toBe(12);
  });
});
