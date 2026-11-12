import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, namesWorkedOut, numberNamed } from "../../../builders/made-up-rule-character";
import type { RuleCharacter } from "../../../../../src/beyond/rules/input/rule-character";
import { workedOut } from "../../../../../src/beyond/rules/worked-out";

function slotCounts(character: RuleCharacter): number[] {
  return workedOut(character)
    .filter((number) => number.name.startsWith("Spell slots level"))
    .map((number) => number.value.valueOr(-1));
}

function slotsOf(className: string, level: number, subclass = ""): number[] {
  return slotCounts(madeUpRuleCharacter({ classes: [classOf(className, level, 8, subclass)] }));
}

describe("SpellSlotsRule for a full caster", () => {
  it.each([
    { level: 1, slots: [2] },
    { level: 2, slots: [3] },
    { level: 3, slots: [4, 2] },
    { level: 5, slots: [4, 3, 2] },
    { level: 9, slots: [4, 3, 3, 3, 1] },
    { level: 13, slots: [4, 3, 3, 3, 2, 1, 1] },
    { level: 17, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 20, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ])("gives $slots at level $level", ({ level, slots }) => {
    expect(slotsOf("Wizard", level)).toEqual(slots);
  });

  it("names each spell level and shows the working", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 3, 6)] });
    const second = numberNamed(character, "Spell slots level 2");
    expect([second.valueOr(-1), second.explanation]).toEqual([2, "Wizard 3, full caster"]);
  });
});

describe("SpellSlotsRule for a half caster", () => {
  it.each([
    { level: 1, slots: [] },
    { level: 2, slots: [2] },
    { level: 5, slots: [4, 2] },
    { level: 9, slots: [4, 3, 2] },
    { level: 13, slots: [4, 3, 3, 1] },
    { level: 17, slots: [4, 3, 3, 3, 1] },
    { level: 20, slots: [4, 3, 3, 3, 2] },
  ])("gives $slots to a paladin at level $level", ({ level, slots }) => {
    expect(slotsOf("Paladin", level)).toEqual(slots);
  });

  it("gives a ranger the same table", () => {
    expect(slotsOf("Ranger", 5)).toEqual([4, 2]);
  });
});

describe("SpellSlotsRule for a third caster", () => {
  it.each([
    { level: 2, slots: [] },
    { level: 3, slots: [2] },
    { level: 7, slots: [4, 2] },
    { level: 13, slots: [4, 3, 2] },
    { level: 19, slots: [4, 3, 3, 1] },
  ])("gives $slots to an Eldritch Knight at level $level", ({ level, slots }) => {
    expect(slotsOf("Fighter", level, "Eldritch Knight")).toEqual(slots);
  });

  it("gives an Arcane Trickster the same table", () => {
    expect(slotsOf("Rogue", 7, "Arcane Trickster")).toEqual([4, 2]);
  });

  it("gives nothing to a fighter of another archetype", () => {
    expect(slotsOf("Fighter", 7, "Champion")).toEqual([]);
  });
});

describe("SpellSlotsRule for a multiclass character", () => {
  function together(...classes: ReturnType<typeof classOf>[]): number[] {
    return slotCounts(madeUpRuleCharacter({ classes }));
  }

  it("adds the levels of full casters and uses the full table: wizard 3 + cleric 2 is level 5", () => {
    expect(together(classOf("Wizard", 3, 6), classOf("Cleric", 2, 8))).toEqual([4, 3, 2]);
  });

  it("adds half a paladin's levels, rounded down: paladin 4 + wizard 4 is level 6", () => {
    expect(together(classOf("Paladin", 4, 10), classOf("Wizard", 4, 6))).toEqual([4, 3, 3]);
  });

  it("rounds each half caster down on its own: paladin 3 + ranger 3 is level 2", () => {
    expect(together(classOf("Paladin", 3, 10), classOf("Ranger", 3, 10))).toEqual([3]);
  });

  it("adds a third of an Eldritch Knight's levels, rounded down: knight 5 + wizard 1 is level 2", () => {
    expect(together(classOf("Fighter", 5, 10, "Eldritch Knight"), classOf("Wizard", 1, 6))).toEqual([3]);
  });

  it("shows the sum it worked", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Paladin", 4, 10), classOf("Wizard", 4, 6)] });
    expect(numberNamed(character, "Spell slots level 1").explanation).toBe("Caster level 6 from Paladin 4 gives 2, Wizard 4 gives 4");
  });

  it("gives no slots when the combined caster level is under 1", () => {
    expect(together(classOf("Paladin", 1, 10), classOf("Ranger", 1, 10))).toEqual([]);
  });

  it("does not know the slots when the combined level is past the table", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 20, 6), classOf("Cleric", 20, 8)] });
    expect(numberNamed(character, "Spell slots").isKnown).toBe(false);
  });

  it("leaves a warlock's pact magic out of the combined level", () => {
    expect(together(classOf("Wizard", 3, 6), classOf("Warlock", 5, 8))).toEqual([4, 2]);
  });
});

describe("SpellSlotsRule and the edition", () => {
  it.each(["2024", "not stated"] as const)("does not know the slots of a paladin when the edition is %s", (edition) => {
    const character = madeUpRuleCharacter({ edition, classes: [classOf("Paladin", 5, 10)] });
    expect(numberNamed(character, "Spell slots").isKnown).toBe(false);
  });

  it("does not know the slots of an Eldritch Knight when the edition is 2024", () => {
    const character = madeUpRuleCharacter({ edition: "2024", classes: [classOf("Fighter", 5, 10, "Eldritch Knight")] });
    expect(numberNamed(character, "Spell slots").isKnown).toBe(false);
  });

  it("does not know the combined slots when one class is a half caster in 2024", () => {
    const character = madeUpRuleCharacter({ edition: "2024", classes: [classOf("Paladin", 4, 10), classOf("Wizard", 4, 6)] });
    expect(numberNamed(character, "Spell slots").explanation).toBe("The slot tables of half and third casters differ between the 2014 and 2024 rules, and the edition is not 2014.");
  });

  it("still knows a wizard's slots in 2024", () => {
    expect(slotCounts(madeUpRuleCharacter({ edition: "2024", classes: [classOf("Wizard", 5, 6)] }))).toEqual([4, 3, 2]);
  });
});

describe("SpellSlotsRule for a class that does not cast", () => {
  it("names no slots", () => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Barbarian", 5, 12)] })).filter((name) => name.startsWith("Spell slots"))).toEqual([]);
  });

  it("does not know the slots when the total level is not known", () => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("Wizard", 0, 6)] }), "Spell slots").isKnown).toBe(false);
  });
});

describe("SpellSlotsRule and an Artificer", () => {
  it("does not know any slots for Wizard 5 and Artificer 3, so no table is shown as known", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6), classOf("Artificer", 3, 8)] });
    const names = namesWorkedOut(character).filter((name) => name.startsWith("Spell slots"));
    expect([names, numberNamed(character, "Spell slots").explanation]).toEqual([["Spell slots"], "Artificer is not built here yet."]);
  });

  it("does not know the slots of an Artificer alone", () => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("Artificer", 3, 8)] }), "Spell slots").isKnown).toBe(false);
  });

  it("leaves a warlock's pact slots standing beside an Artificer", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Warlock", 2, 8), classOf("Artificer", 3, 8)] });
    expect(numberNamed(character, "Pact slots").isKnown).toBe(true);
  });

  it("shows no slot entry for a combined caster level under 1", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Paladin", 1, 10), classOf("Ranger", 1, 10)] });
    expect(namesWorkedOut(character).filter((name) => name.startsWith("Spell slots"))).toEqual([]);
  });
});
