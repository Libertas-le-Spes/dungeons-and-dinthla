import { describe, expect, it } from "vitest";
import { INTELLIGENCE, WISDOM } from "../../../../../src/beyond/rules/input/ability";
import type { CasterClass } from "../../../../../src/beyond/rules/spells/casters/caster-class";
import { CASTER_CLASSES } from "../../../../../src/beyond/rules/spells/casters/caster-classes";
import { AbilityTable } from "../../../../../src/beyond/rules/input/by-ability";
import { classOf, madeUpRuleCharacter, modifierOf, scoresOf } from "../../../builders/made-up-rule-character";
import { namesWorkedOut, numberNamed } from "../../../builders/rule-numbers";
import { onlyAbilityRaised } from "../../../builders/rule-test-helpers";

const ABILITY_OF = new Map<string, string>([
  ["Bard", "CHA"],
  ["Cleric", "WIS"],
  ["Druid", "WIS"],
  ["Sorcerer", "CHA"],
  ["Wizard", "INT"],
  ["Paladin", "CHA"],
  ["Ranger", "WIS"],
  ["Warlock", "CHA"],
  ["Eldritch Knight", "INT"],
  ["Arcane Trickster", "INT"],
]);

function abilityShortOf(label: string): string {
  const found = ABILITY_OF.get(label);
  if (found === undefined) throw new Error(`No casting ability is expected for ${label}.`);
  return found;
}

function labelOf(caster: CasterClass): string {
  return caster.label;
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

  it("knows the casting ability of every caster the source lists, and no other", () => {
    expect([...ABILITY_OF.keys()].sort()).toEqual(CASTER_CLASSES.map(labelOf).sort());
  });

  it.each(CASTER_CLASSES)("casts $label with its own ability only", (caster) => {
    const short = abilityShortOf(caster.label);
    const character = madeUpRuleCharacter({ classes: [classOf(caster.className, 5, 8, caster.subclass)], baseScores: onlyAbilityRaised(short) });
    expect([numberNamed(character, caster.saveDcName).valueOr(-1), numberNamed(character, caster.attackName).valueOr(-1)]).toEqual([13, 5]);
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

describe("SpellcastingRule before a class casts", () => {
  it.each([
    { className: "Fighter", subclass: "Eldritch Knight", level: 1 },
    { className: "Fighter", subclass: "Eldritch Knight", level: 2 },
    { className: "Rogue", subclass: "Arcane Trickster", level: 2 },
    { className: "Paladin", subclass: "", level: 1 },
    { className: "Ranger", subclass: "", level: 1 },
  ])("shows no spell numbers for $className $subclass at level $level in the 2014 rules", ({ className, subclass, level }) => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf(className, level, 8, subclass)] })).filter(isSpellNumber)).toEqual([]);
  });

  it.each([
    { className: "Fighter", subclass: "Eldritch Knight", level: 3 },
    { className: "Paladin", subclass: "", level: 2 },
  ])("shows spell numbers for $className $subclass at level $level, where it first casts", ({ className, subclass, level }) => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf(className, level, 8, subclass)] })).filter(isSpellNumber)).toHaveLength(2);
  });

  it.each(["2024", "not stated"] as const)("does not know a level 1 paladin's spell numbers when the edition is %s", (edition) => {
    const character = madeUpRuleCharacter({ edition, classes: [classOf("Paladin", 1, 10)] });
    expect([numberNamed(character, "Paladin spell save DC").explanation, numberNamed(character, "Paladin spell attack bonus").isKnown]).toEqual(["I can't tell whether this class casts yet in this edition.", false]);
  });

  it("shows a level 1 wizard's spell numbers in every edition", () => {
    const character = madeUpRuleCharacter({ edition: "2024", classes: [classOf("Wizard", 1, 6)] });
    expect(numberNamed(character, "Wizard spell save DC").isKnown).toBe(true);
  });
});

describe("SpellcastingRule and an Artificer", () => {
  it("does not know the Artificer's own spell numbers and says it is not built", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Artificer", 3, 8)] });
    expect([numberNamed(character, "Artificer spell save DC").explanation, numberNamed(character, "Artificer spell attack bonus").isKnown]).toEqual(["Artificer is not built here yet.", false]);
  });

  it("leaves another class's spell numbers standing", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6), classOf("Artificer", 3, 8)] });
    expect(numberNamed(character, "Wizard spell save DC").isKnown).toBe(true);
  });
});

describe("SpellcastingRule and modifiers", () => {
  const wizard = [classOf("Wizard", 5, 6)];

  it("adds a plain spell attack bonus and shows its source", () => {
    const character = madeUpRuleCharacter({ classes: wizard, modifiers: [modifierOf("bonus", "spell-attacks", 2, "Pale Rod")] });
    const attack = numberNamed(character, "Wizard spell attack bonus");
    expect([attack.valueOr(-1), attack.explanation]).toEqual([5, "proficiency 3 + INT 0 + Pale Rod 2 = 5, Wizard, casting with Intelligence"]);
  });

  it("leaves the save DC alone for a spell attack bonus", () => {
    const character = madeUpRuleCharacter({ classes: wizard, modifiers: [modifierOf("bonus", "spell-attacks", 2, "Pale Rod")] });
    expect(numberNamed(character, "Wizard spell save DC").valueOr(-1)).toBe(11);
  });

  it("adds a plain spell save DC bonus", () => {
    const character = madeUpRuleCharacter({ classes: wizard, modifiers: [modifierOf("bonus", "spell-save-dc", 1, "Pale Rod")] });
    expect(numberNamed(character, "Wizard spell save DC").valueOr(-1)).toBe(12);
  });

  it("does not know the attack when a modifier on it is one it does not know", () => {
    const character = madeUpRuleCharacter({ classes: wizard, modifiers: [modifierOf("set", "spell-attacks", 9, "Pale Rod")] });
    expect([numberNamed(character, "Wizard spell attack bonus").isKnown, numberNamed(character, "Wizard spell save DC").isKnown]).toEqual([false, true]);
  });

  it("lists a restricted spell attack bonus and does not apply it", () => {
    const character = madeUpRuleCharacter({ classes: wizard, modifiers: [modifierOf("bonus", "spell-attacks", 2, "Pale Rod", "against undead")] });
    expect(numberNamed(character, "Wizard spell attack bonus").explanation).toBe("proficiency 3 + INT 0 = 3, Wizard, casting with Intelligence. Plus conditional bonuses I don't apply: Pale Rod");
  });
});

function isSpellNumber(name: string): boolean {
  return name.includes("spell");
}

describe("SpellcastingRule and the way the class is written", () => {
  it("finds a wizard written in lower case", () => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf(" WIZARD ", 5, 6)] }), "Wizard spell save DC").valueOr(-1)).toBe(11);
  });
});
