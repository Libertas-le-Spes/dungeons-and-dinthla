import { describe, expect, it } from "vitest";
import { FeatureTouching, MAY_CHANGE_IT } from "../../../../src/beyond/rules/core/feature-touching";
import { classOf, madeUpRuleCharacter } from "../../builders/made-up-rule-character";
import { numberNamed } from "../../builders/rule-numbers";

const AC_FEATURES = ["Medium Armor Master", "Dual Wielder", "Bladesong"];
const AC_SPECIES = ["Autognome", "Lizardfolk", "Locathah", "Loxodon", "Simic Hybrid", "Thri-kreen", "Tortle", "Warforged"];
const INITIATIVE_FEATURES = ["Alert", "Rakish Audacity", "Dread Ambusher", "Tactical Wit"];
const SPEED_FEATURES = ["Mobile", "Fast Movement", "Unarmored Movement", "Speedy", "Squat Nimbleness"];

describe("FeatureTouching", () => {
  const touching = new FeatureTouching(["Alert", "Tortle", "Artificer"], "changes it");

  it("finds a name among the features, the species or the classes", () => {
    const character = madeUpRuleCharacter({ features: ["Alert"], species: "Tortle", classes: [classOf("Artificer", 1, 8)] });
    expect(touching.named(character)).toEqual(["Alert", "Tortle", "Artificer"]);
  });

  it("finds nothing for a character with none of them", () => {
    expect([touching.named(madeUpRuleCharacter()), touching.unknownFor(madeUpRuleCharacter())]).toEqual([[], null]);
  });

  it("says in plain words what it found, with the route", () => {
    const value = touching.unknownFor(madeUpRuleCharacter({ features: ["Alert"] }));
    expect([value?.isKnown, value?.explanation]).toEqual([false, "Alert changes it."]);
  });

  it("lists at most five names and counts the rest", () => {
    const many = new FeatureTouching(["A1", "A2", "A3", "A4", "A5", "A6", "A7"], MAY_CHANGE_IT);
    const value = many.unknownFor(madeUpRuleCharacter({ features: ["A1", "A2", "A3", "A4", "A5", "A6", "A7"] }));
    expect(value?.explanation).toBe("A1, A2, A3, A4, A5 and 2 more may change this.");
  });
});

describe("what makes armour class not known", () => {
  it.each(AC_FEATURES)("the feature %s", (feature) => {
    expect(numberNamed(madeUpRuleCharacter({ features: [feature] }), "AC").explanation).toBe(`${feature} may change this.`);
  });

  it.each(AC_SPECIES)("the species %s", (species) => {
    expect(numberNamed(madeUpRuleCharacter({ species }), "AC").isKnown).toBe(false);
  });

  it("the species, even in armour, because the natural number may be better", () => {
    expect(numberNamed(madeUpRuleCharacter({ species: "Tortle", items: [] }), "AC").isKnown).toBe(false);
  });
});

describe("what makes initiative not known", () => {
  it.each(INITIATIVE_FEATURES)("the feature %s, in either edition", (feature) => {
    const found = [numberNamed(madeUpRuleCharacter({ features: [feature], edition: "2014" }), "Initiative").isKnown, numberNamed(madeUpRuleCharacter({ features: [feature], edition: "2024" }), "Initiative").isKnown];
    expect(found).toEqual([false, false]);
  });
});

describe("what makes the other values not known", () => {
  it("Aura of Protection, for every save and no skill", () => {
    const character = madeUpRuleCharacter({ features: ["Aura of Protection"] });
    expect([numberNamed(character, "STR save").isKnown, numberNamed(character, "CHA save").isKnown, numberNamed(character, "Stealth").isKnown]).toEqual([false, false, true]);
  });

  it("Remarkable Athlete, for every skill", () => {
    const character = madeUpRuleCharacter({ features: ["Remarkable Athlete"] });
    expect([numberNamed(character, "Athletics").isKnown, numberNamed(character, "Arcana").isKnown, numberNamed(character, "STR save").isKnown]).toEqual([false, false, true]);
  });

  it.each(SPEED_FEATURES)("the feature %s, for speed", (feature) => {
    expect(numberNamed(madeUpRuleCharacter({ features: [feature] }), "Speed").isKnown).toBe(false);
  });

  it("leaves a value standing when only another value's feature is named", () => {
    const character = madeUpRuleCharacter({ features: ["Powerful Build"] });
    expect([numberNamed(character, "AC").isKnown, numberNamed(character, "Speed").isKnown, numberNamed(character, "Initiative").isKnown]).toEqual([true, true, true]);
  });
});

describe("FeatureTouching and the way names are written", () => {
  it.each(["Thri-Kreen", "tortle", "  TORTLE  ", "WARFORGED"])("makes armour class not known for the species written as %s", (species) => {
    expect(numberNamed(madeUpRuleCharacter({ species }), "AC").isKnown).toBe(false);
  });

  it.each(["alert", " ALERT ", "Alert"])("makes initiative not known for the feature written as %s", (feature) => {
    expect(numberNamed(madeUpRuleCharacter({ features: [feature] }), "Initiative").isKnown).toBe(false);
  });

  it("finds a class written in lower case", () => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("artificer", 3, 8)] }), "Spell slots").isKnown).toBe(false);
  });

  it("makes armour class not known for Soul of the Forge", () => {
    expect(numberNamed(madeUpRuleCharacter({ features: ["Soul of the Forge"] }), "AC").isKnown).toBe(false);
  });

  it.each(["Roving", "Aura of Alacrity", "Drunken Technique", "Unarmored Movement Improvement"])("makes speed not known for %s", (feature) => {
    expect(numberNamed(madeUpRuleCharacter({ features: [feature] }), "Speed").isKnown).toBe(false);
  });
});
