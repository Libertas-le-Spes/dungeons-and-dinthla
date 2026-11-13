import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

describe("HitDiceRule", () => {
  it("counts one die a level and names each class's die", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 3, 10), classOf("Wizard", 2, 6)] });
    const dice = numberNamed(character, "Hit dice");
    expect([dice.valueOr(-1), dice.explanation]).toEqual([5, "Fighter 3d10 + Wizard 2d6"]);
  });

  it.each([4, 6, 8, 10, 12])("knows a d%s", (sides) => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("Fighter", 1, sides)] }), "Hit dice").isKnown).toBe(true);
  });

  it.each([0, 3, 7, 20])("does not know a d%s", (sides) => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("Fighter", 1, sides)] }), "Hit dice").isKnown).toBe(false);
  });
});
