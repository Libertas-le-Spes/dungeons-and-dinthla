import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, modifierOf, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

function withConstitution(score: number) {
  return scoresOf(10, 10, score, 10, 10, 10);
}

const MINIMUM_REASON = "I could not tell whether the minimum of 1 hit point a level applies, because the constitution modifier is negative and the dice total is only a sum.";

describe("MaxHitPointsRule", () => {
  it("adds the constitution modifier for the one level: 12 + 2 = 14", () => {
    const character = madeUpRuleCharacter({ baseHitPoints: 12, baseScores: withConstitution(14) });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([14, "12 + CON 2 x 1 = 14"]);
  });

  it("adds the constitution modifier once for every level at level 5", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10)], baseHitPoints: 40, baseScores: withConstitution(14) });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([50, "40 + CON 2 x 5 = 50"]);
  });

  it.each([
    { constitution: 8, modifier: -1, hitPoints: 25 },
    { constitution: 9, modifier: -1, hitPoints: 25 },
    { constitution: 10, modifier: 0, hitPoints: 30 },
    { constitution: 11, modifier: 0, hitPoints: 30 },
    { constitution: 15, modifier: 2, hitPoints: 40 },
  ])("gives $hitPoints at level 5 with a constitution of $constitution (modifier $modifier)", ({ constitution, hitPoints }) => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 6)], baseHitPoints: 30, baseScores: withConstitution(constitution) });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(hitPoints);
  });

  it("adds the bonus hit points and shows them", () => {
    const character = madeUpRuleCharacter({ baseHitPoints: 10, bonusHitPoints: 3 });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([13, "10 + CON 0 x 1 + bonus 3 = 13"]);
  });

  it("takes the hit points D&D Beyond itself holds over the working", () => {
    const character = madeUpRuleCharacter({ baseHitPoints: 12, overrideHitPoints: 40 });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([40, "Hit points set on D&D Beyond: 40"]);
  });

  it.each([
    { override: 0, known: false },
    { override: 1, known: true },
    { override: 9_999, known: true },
    { override: 10_000, known: false },
    { override: -1, known: false },
  ])("knows an override of $override: $known", ({ override, known }) => {
    expect(numberNamed(madeUpRuleCharacter({ overrideHitPoints: override }), "HP").isKnown).toBe(known);
  });

  it("adds two a level for the Tough feat", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10)], baseHitPoints: 40, features: ["Tough"] });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([50, "40 + CON 0 x 5 + Tough 2 x 5 = 50"]);
  });

  it("adds one a level for Dwarven Toughness", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10)], baseHitPoints: 40, features: ["Dwarven Toughness"] });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(45);
  });

  it("adds one for each draconic sorcerer level in the 2014 rules and not for the other classes", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Sorcerer", 3, 6, "Draconic Bloodline"), classOf("Fighter", 2, 10)], baseHitPoints: 30 });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([33, "30 + CON 0 x 5 + Draconic Resilience 1 x 3 = 33"]);
  });

  it.each(["2024", "not stated"] as const)("does not know a draconic sorcerer's hit points when the edition is %s", (edition) => {
    const character = madeUpRuleCharacter({ edition, classes: [classOf("Sorcerer", 3, 6, "Draconic Bloodline")] });
    expect(numberNamed(character, "HP").isKnown).toBe(false);
  });

  it("adds nothing for a sorcerer of another bloodline", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Sorcerer", 3, 6, "Wild Magic")], baseHitPoints: 20 });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(20);
  });

  it("does not count a per-level modifier from a source it already works out", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10)], baseHitPoints: 40, features: ["Tough"], modifiers: [modifierOf("bonus", "hit-points-per-level", 2, "Tough")] });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(50);
  });

  it("does not know the hit points when a per-level modifier has a source it does not know", () => {
    const character = madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "hit-points-per-level", 1, "Pale Charm")] });
    const hitPoints = numberNamed(character, "HP");
    expect([hitPoints.isKnown, hitPoints.explanation]).toEqual([false, 'D&D Beyond names a rule I can\'t work out here: "hit-points-per-level". Type it on your note to set it.']);
  });

  it("leaves out an unknown per-level modifier that does not apply now", () => {
    const character = madeUpRuleCharacter({ baseHitPoints: 10, modifiers: [{ ...modifierOf("bonus", "hit-points-per-level", 1, "Pale Charm"), inForce: false }] });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(10);
  });

  it("knows level 1 with a negative constitution when the first die leaves at least 1", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 1, 6)], baseHitPoints: 6, baseScores: withConstitution(8) });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(5);
  });

  it("does not know level 1 with a negative constitution when the minimum of 1 could apply", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 1, 6)], baseHitPoints: 1, baseScores: withConstitution(8) });
    expect(numberNamed(character, "HP").explanation).toBe(MINIMUM_REASON);
  });

  it("knows level 2 with constitution -1 when no split of the dice could need the minimum", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 2, 6)], baseHitPoints: 8, baseScores: withConstitution(8) });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(6);
  });

  it("does not know level 2 with constitution -1 when one die could have rolled a 1", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 2, 6)], baseHitPoints: 7, baseScores: withConstitution(8) });
    expect(numberNamed(character, "HP").explanation).toBe(MINIMUM_REASON);
  });

  it("proves the minimum on the largest die of a multiclass character", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 1, 6), classOf("Fighter", 1, 10)], baseHitPoints: 11, baseScores: withConstitution(8) });
    expect(numberNamed(character, "HP").explanation).toBe(MINIMUM_REASON);
  });

  it("does not look at the minimum when the constitution modifier is zero or more", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6)], baseHitPoints: 5 });
    expect(numberNamed(character, "HP").valueOr(-1)).toBe(5);
  });

  it.each([
    { name: "the dice total", changes: { baseHitPoints: null } },
    { name: "the bonus hit points", changes: { bonusHitPoints: null } },
  ])("does not know the hit points when $name is missing", ({ changes }) => {
    expect(numberNamed(madeUpRuleCharacter(changes), "HP").isKnown).toBe(false);
  });

  it("does not know the hit points when the constitution modifier is not known", () => {
    const character = madeUpRuleCharacter({ baseScores: scoresOf(10, 10, 0, 10, 10, 10) });
    expect(numberNamed(character, "HP").explanation).toBe("It needs CON modifier, which is not known: It needs CON, which is not known: An ability score has to be a whole number from 1 to 30.");
  });
});
