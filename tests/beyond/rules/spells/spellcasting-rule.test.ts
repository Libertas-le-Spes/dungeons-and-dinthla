import { describe, expect, it } from "vitest";
import { ABILITIES, CHARISMA, INTELLIGENCE, WISDOM } from "../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { classOf, madeUpRuleCharacter, namesWorkedOut, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

const CASTERS = [
  { label: "Bard", className: "Bard", subclass: "", ability: CHARISMA },
  { label: "Cleric", className: "Cleric", subclass: "", ability: WISDOM },
  { label: "Druid", className: "Druid", subclass: "", ability: WISDOM },
  { label: "Sorcerer", className: "Sorcerer", subclass: "", ability: CHARISMA },
  { label: "Wizard", className: "Wizard", subclass: "", ability: INTELLIGENCE },
  { label: "Paladin", className: "Paladin", subclass: "", ability: CHARISMA },
  { label: "Ranger", className: "Ranger", subclass: "", ability: WISDOM },
  { label: "Warlock", className: "Warlock", subclass: "", ability: CHARISMA },
  { label: "Eldritch Knight", className: "Fighter", subclass: "Eldritch Knight", ability: INTELLIGENCE },
  { label: "Arcane Trickster", className: "Rogue", subclass: "Arcane Trickster", ability: INTELLIGENCE },
];

function onlyAbilityRaised(raised: string): AbilityTable<number> {
  const scores = new AbilityTable<number>();
  for (const ability of ABILITIES) {
    if (ability.short === raised) scores.with(ability, 14);
    else scores.with(ability, 10);
  }
  return scores;
}

describe("SpellcastingRule", () => {
  it("works out the save DC and the attack bonus of a wizard and shows the working", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6)], baseScores: scoresOf(10, 10, 10, 16, 10, 10) });
    const dc = numberNamed(character, "Wizard spell save DC");
    const attack = numberNamed(character, "Wizard spell attack bonus");
    expect([dc.valueOr(-1), dc.explanation, attack.valueOr(-1), attack.explanation]).toEqual([
      14,
      "8 + proficiency 3 + INT 3 = 14, Wizard, casting with Intelligence",
      6,
      "proficiency 3 + INT 3 = 6, Wizard, casting with Intelligence",
    ]);
  });

  it.each(CASTERS)("casts $label with its own ability only", ({ label, className, subclass, ability }) => {
    const character = madeUpRuleCharacter({ classes: [classOf(className, 5, 8, subclass)], baseScores: onlyAbilityRaised(ability.short) });
    expect([numberNamed(character, `${label} spell save DC`).valueOr(-1), numberNamed(character, `${label} spell attack bonus`).valueOr(-1)]).toEqual([13, 5]);
  });

  it("gives no spell numbers to a fighter who is not an Eldritch Knight", () => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Fighter", 5, 10, "Champion")] })).filter(isSpellNumber)).toEqual([]);
  });

  it("gives no spell numbers to a class that does not cast", () => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Barbarian", 5, 12)] })).filter(isSpellNumber)).toEqual([]);
  });

  it("works out each casting class on its own ability for a multiclass character", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 3, 6), classOf("Cleric", 2, 8)], baseScores: scoresOf(10, 10, 10, 16, 14, 10) });
    expect([numberNamed(character, "Wizard spell save DC").valueOr(-1), numberNamed(character, "Cleric spell save DC").valueOr(-1)]).toEqual([14, 13]);
  });

  it("does not know the spell numbers when the casting ability is not known, and leaves the rest standing", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6)], baseScores: new AbilityTable<number>().with(INTELLIGENCE, 99).with(WISDOM, 10) });
    expect([numberNamed(character, "Wizard spell save DC").isKnown, numberNamed(character, "Wizard spell attack bonus").isKnown, numberNamed(character, "WIS").isKnown]).toEqual([false, false, true]);
  });
});

function isSpellNumber(name: string): boolean {
  return name.includes("spell");
}
