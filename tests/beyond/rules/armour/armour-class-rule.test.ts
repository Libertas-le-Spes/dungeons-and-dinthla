import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../src/beyond/rules/input/armour/heavy-armour";
import { LightArmour } from "../../../../src/beyond/rules/input/armour/light-armour";
import { Shield } from "../../../../src/beyond/rules/input/armour/shield";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";
import { armourClassOf, classOf, itemOf, madeUpRuleCharacter, modifierOf, numberNamed, scoresOf } from "../../builders/made-up-rule-character";

describe("ArmourClassRule with a shield", () => {
  const shield = itemOf("Oak Shield", new Shield(), 2);

  it("adds the shield to no armour", () => {
    expect(armourClassOf({ items: [shield] })).toEqual({ value: 12, working: "10 + DEX 0 + Oak Shield 2 = 12, no armour" });
  });

  it("adds the shield to body armour", () => {
    expect(armourClassOf({ items: [itemOf("Chain Mail", new HeavyArmour(), 16), shield] }).value).toBe(18);
  });

  it("adds a shield's own number, not always 2", () => {
    expect(armourClassOf({ items: [itemOf("Pale Shield", new Shield(), 3)] }).value).toBe(13);
  });
});

describe("ArmourClassRule picking the best formula", () => {
  it("takes the monk's formula for a monk and barbarian when wisdom is higher", () => {
    const character = { classes: [classOf("Monk", 1, 8), classOf("Barbarian", 1, 12)], baseScores: scoresOf(10, 14, 12, 10, 18, 10) };
    expect(armourClassOf(character).working).toBe("10 + DEX 2 + WIS 4 = 16, monk's unarmoured defence");
  });

  it("takes the barbarian's formula for a monk and barbarian when constitution is higher", () => {
    const character = { classes: [classOf("Monk", 1, 8), classOf("Barbarian", 1, 12)], baseScores: scoresOf(10, 14, 18, 10, 12, 10) };
    expect(armourClassOf(character).working).toBe("10 + DEX 2 + CON 4 = 16, barbarian's unarmoured defence");
  });
});

describe("ArmourClassRule with more than one", () => {
  it("does not know the armour class with two body armours, and names both", () => {
    const character = madeUpRuleCharacter({ items: [itemOf("Leather", new LightArmour(), 11), itemOf("Chain Mail", new HeavyArmour(), 16)] });
    const value = numberNamed(character, "AC");
    expect([value.isKnown, value.explanation]).toEqual([false, "More than one body armour is worn (Leather, Chain Mail). Settle it on D&D Beyond."]);
  });

  it("does not know the armour class with two shields", () => {
    const character = madeUpRuleCharacter({ items: [itemOf("Oak Shield", new Shield(), 2), itemOf("Pale Shield", new Shield(), 2)] });
    expect(numberNamed(character, "AC").explanation).toBe("More than one shield is held (Oak Shield, Pale Shield). Settle it on D&D Beyond.");
  });

  it("knows the armour class when the second body armour is not equipped", () => {
    const spare = { ...itemOf("Chain Mail", new HeavyArmour(), 16), equipped: false };
    expect(armourClassOf({ items: [itemOf("Leather", new LightArmour(), 11), spare] }).value).toBe(11);
  });
});

describe("ArmourClassRule with what it does not know", () => {
  const unknownModifier = modifierOf("bonus", "armored-armor-class", 1, "Pale Charm");

  it("does not know the armour class with an armour class modifier it does not know, and names it", () => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [unknownModifier] }), "AC");
    expect([value.isKnown, value.explanation]).toEqual([false, 'D&D Beyond names a rule I can\'t work out here: "armored-armor-class". Type it on your note to set it.']);
  });

  it("leaves the hit points standing when only the armour class is not known", () => {
    const character = madeUpRuleCharacter({ modifiers: [unknownModifier], baseHitPoints: 12 });
    expect([numberNamed(character, "AC").isKnown, numberNamed(character, "HP").valueOr(-1)]).toEqual([false, 12]);
  });

  it("does not know the armour class when the dexterity modifier is not known", () => {
    expect(numberNamed(madeUpRuleCharacter({ baseScores: new AbilityTable<number>() }), "AC").isKnown).toBe(false);
  });

  it("does not know the armour class in heavy armour when the dexterity modifier is not known", () => {
    const heavy = itemOf("Chain Mail", new HeavyArmour(), 16);
    expect(numberNamed(madeUpRuleCharacter({ baseScores: new AbilityTable<number>(), items: [heavy] }), "AC").isKnown).toBe(false);
  });
});

describe("ArmourClassRule range", () => {
  it.each([
    { armourClass: 0, known: true },
    { armourClass: 40, known: true },
    { armourClass: -1, known: false },
    { armourClass: 41, known: false },
  ])("knows a heavy armour of $armourClass: $known", ({ armourClass, known }) => {
    const heavy = itemOf("Pale Mail", new HeavyArmour(), armourClass);
    expect(numberNamed(madeUpRuleCharacter({ items: [heavy] }), "AC").isKnown).toBe(known);
  });
});

describe("ArmourClassRule when two formulas give the same number", () => {
  it("shows the plain formula, which is listed first, when the monk's formula gives the same", () => {
    const character = { classes: [classOf("Monk", 1, 8)], baseScores: scoresOf(10, 14, 10, 10, 10, 10) };
    expect(armourClassOf(character)).toEqual({ value: 12, working: "10 + DEX 2 = 12, no armour" });
  });

  it("shows the monk's formula, which is listed before the barbarian's, when both give the same", () => {
    const character = { classes: [classOf("Monk", 1, 8), classOf("Barbarian", 1, 12)], baseScores: scoresOf(10, 14, 14, 10, 14, 10) };
    expect(armourClassOf(character).working).toBe("10 + DEX 2 + WIS 2 = 14, monk's unarmoured defence");
  });

  it("shows the barbarian's formula, listed before the draconic one, when both give 15", () => {
    const character = { classes: [classOf("Barbarian", 1, 12), classOf("Sorcerer", 1, 6, "Draconic Bloodline")], baseScores: scoresOf(10, 14, 16, 10, 10, 10) };
    expect(armourClassOf(character).working).toBe("10 + DEX 2 + CON 3 = 15, barbarian's unarmoured defence");
  });
});

describe("ArmourClassRule and whole numbers", () => {
  it("does not apply two modifiers of one half each as a known bonus", () => {
    const halves = [modifierOf("bonus", "armor-class", 0.5, "Pale Ring"), modifierOf("bonus", "armor-class", 0.5, "Pale Cloak")];
    expect(numberNamed(madeUpRuleCharacter({ modifiers: halves }), "AC").isKnown).toBe(false);
  });

  it("names the modifier it could not use", () => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "armor-class", 0.5, "Pale Ring")] }), "AC");
    expect(value.explanation).toBe('D&D Beyond names a rule I can\'t work out here: "armor-class". Type it on your note to set it.');
  });
});

describe("ArmourClassRule names that carry markup", () => {
  it("keeps a body armour name with markup from reaching the working as markup", () => {
    const evil = "Evil ## Heading [[x]]";
    const character = madeUpRuleCharacter({ items: [itemOf(evil, new LightArmour(), 11), itemOf("Chain Mail", new HeavyArmour(), 16)] });
    const text = numberNamed(character, "AC").explanation;
    expect([text.includes("[["), text.includes("\n"), text.includes("\\[\\[x")]).toEqual([false, false, true]);
  });
});

describe("ArmourClassRule and modifier values that are too big or not exact", () => {
  it.each([9_007_199_254_740_993, -9_007_199_254_740_992, 1e300, -1e300, 101, -101])("does not use a modifier of %s, and names it", (amount) => {
    const value = numberNamed(madeUpRuleCharacter({ modifiers: [modifierOf("bonus", "armor-class", amount, "Pale Ring")] }), "AC");
    expect([value.isKnown, value.explanation]).toEqual([false, 'D&D Beyond names a rule I can\'t work out here: "armor-class". Type it on your note to set it.']);
  });

  it("uses a modifier of 1 exactly", () => {
    expect(armourClassOf({ modifiers: [modifierOf("bonus", "armor-class", 1, "Pale Ring")] }).value).toBe(11);
  });
});
