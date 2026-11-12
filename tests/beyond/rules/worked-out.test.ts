import { describe, expect, it } from "vitest";
import { AbilityTable } from "../../../src/beyond/rules/input/by-ability";
import { STRENGTH } from "../../../src/beyond/rules/input/ability";
import { workedOut } from "../../../src/beyond/rules/worked-out";
import { classOf, madeUpRuleCharacter, namesWorkedOut, numberNamed, scoresOf } from "../builders/made-up-rule-character";

const SKILL_NAMES = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

const ABILITY_NAMES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

function byPlace(first: number, second: number): number {
  return first - second;
}

describe("workedOut", () => {
  it("works the numbers out in the documented order for a character who does not cast", () => {
    expect(namesWorkedOut(madeUpRuleCharacter())).toEqual([
      "Total level",
      "Proficiency bonus",
      ...ABILITY_NAMES,
      ...ABILITY_NAMES.map((name) => `${name} modifier`),
      "Hit dice",
      "HP",
      "Current HP",
      "Temporary HP",
      "AC",
      "Initiative",
      "Speed",
      ...ABILITY_NAMES.map((name) => `${name} save`),
      ...SKILL_NAMES,
      "Passive Perception",
      "Passive Investigation",
      "Passive Insight",
      "Carrying capacity",
    ]);
  });

  it("puts the spell numbers after the passive scores and before the carrying capacity", () => {
    const names = namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Wizard", 3, 6)] }));
    const places = ["Passive Insight", "Wizard spell save DC", "Wizard spell attack bonus", "Spell slots level 1", "Spell slots level 2", "Carrying capacity"].map((name) => names.indexOf(name));
    expect(places).toEqual([...places].sort(byPlace));
    expect(places).not.toContain(-1);
  });

  it("names every number once for a multiclass caster with pact magic", () => {
    const classes = [classOf("Wizard", 3, 6), classOf("Cleric", 2, 8), classOf("Warlock", 2, 8), classOf("Fighter", 3, 10, "Eldritch Knight")];
    const names = namesWorkedOut(madeUpRuleCharacter({ classes }));
    expect(new Set(names).size).toBe(names.length);
  });

  it("works out the made-up primary monk: armour class 16 and hit points 14, with the working under each", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Monk", 1, 8)], baseScores: scoresOf(10, 18, 14, 10, 14, 10), baseHitPoints: 12 });
    const armourClass = numberNamed(character, "AC");
    const hitPoints = numberNamed(character, "HP");
    expect([armourClass.valueOr(-1), armourClass.explanation, hitPoints.valueOr(-1), hitPoints.explanation]).toEqual([
      16,
      "10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence",
      14,
      "12 + CON 2 x 1 = 14",
    ]);
  });

  it("leaves every value that does not need a missing score standing", () => {
    const character = madeUpRuleCharacter({ baseScores: new AbilityTable<number>().with(STRENGTH, 14) });
    const known = workedOut(character).filter((number) => number.value.isKnown).map((number) => number.name);
    expect(known).toEqual(["Total level", "Proficiency bonus", "STR", "STR modifier", "Hit dice", "Temporary HP", "Speed", "STR save", "Athletics", "Carrying capacity"]);
  });

  it("gives every number the route of the character", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 3, 6)] });
    const routes = workedOut(character).map((number) => number.value.route);
    expect(routes.every((route) => route === character.route)).toBe(true);
  });
});
