import { describe, expect, it } from "vitest";
import { ARMOUR_CLASS, CHARACTER_LEVEL, CLASS_LEVEL, HIT_POINTS, ITEM_COUNT, SCORE, SPEED, TOTAL_LEVEL, COIN_COUNT, ABILITY_MODIFIER, PROFICIENCY_BONUS, TEMPORARY_HIT_POINTS, SAVING_THROW, SKILL_BONUS, INITIATIVE, PASSIVE_SCORE, SPELL_SAVE_DC, SPELL_ATTACK, SPELL_SLOTS, CARRYING_CAPACITY } from "../../../src/beyond/shape/import-limits";
import { Online, Pdf } from "../../../src/beyond/shape/route";
import { numberInRange } from "../../../src/beyond/shape/number-in-range";

const ROUTE = new Pdf();

const EDGES = [
  { name: "a score", range: SCORE, lowest: 1, highest: 30 },
  { name: "armor class", range: ARMOUR_CLASS, lowest: 0, highest: 40 },
  { name: "hit points", range: HIT_POINTS, lowest: 0, highest: 9_999 },
  { name: "a class level", range: CLASS_LEVEL, lowest: 1, highest: 20 },
  { name: "the total level", range: TOTAL_LEVEL, lowest: 1, highest: 40 },
  { name: "the character level", range: CHARACTER_LEVEL, lowest: 1, highest: 20 },
  { name: "speed", range: SPEED, lowest: 0, highest: 500 },
  { name: "a coin count", range: COIN_COUNT, lowest: 0, highest: 1_000_000 },
  { name: "an item count", range: ITEM_COUNT, lowest: 0, highest: 9_999 },
  { name: "an ability modifier", range: ABILITY_MODIFIER, lowest: -5, highest: 10 },
  { name: "the proficiency bonus", range: PROFICIENCY_BONUS, lowest: 2, highest: 11 },
  { name: "temporary hit points", range: TEMPORARY_HIT_POINTS, lowest: 0, highest: 9_999 },
  { name: "a saving throw bonus", range: SAVING_THROW, lowest: -20, highest: 50 },
  { name: "a skill bonus", range: SKILL_BONUS, lowest: -20, highest: 60 },
  { name: "initiative", range: INITIATIVE, lowest: -20, highest: 50 },
  { name: "a passive score", range: PASSIVE_SCORE, lowest: 0, highest: 80 },
  { name: "a spell save DC", range: SPELL_SAVE_DC, lowest: 0, highest: 60 },
  { name: "a spell attack bonus", range: SPELL_ATTACK, lowest: -20, highest: 50 },
  { name: "a count of spell slots", range: SPELL_SLOTS, lowest: 0, highest: 9 },
  { name: "carrying capacity", range: CARRYING_CAPACITY, lowest: 1, highest: 3_600 },
];

describe("numberInRange", () => {
  it.each(EDGES)("knows $name exactly at its lowest", ({ range, lowest }) => {
    expect(numberInRange(lowest, range, "as printed", ROUTE).valueOr(-1)).toBe(lowest);
  });

  it.each(EDGES)("knows $name exactly at its highest", ({ range, highest }) => {
    expect(numberInRange(highest, range, "as printed", ROUTE).valueOr(-1)).toBe(highest);
  });

  it.each(EDGES)("does not know $name one under its lowest", ({ range, lowest }) => {
    expect(numberInRange(lowest - 1, range, "as printed", ROUTE).isKnown).toBe(false);
  });

  it.each(EDGES)("does not know $name one over its highest", ({ range, highest }) => {
    expect(numberInRange(highest + 1, range, "as printed", ROUTE).isKnown).toBe(false);
  });

  it.each([1.5, 16.0001, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("does not know the number %s, though it is not a whole number or not a number", (value) => {
    expect(numberInRange(value, SCORE, "as printed", ROUTE).isKnown).toBe(false);
  });

  it("does not know a negative zero", () => {
    expect(numberInRange(-0, ARMOUR_CLASS, "as printed", ROUTE).isKnown).toBe(false);
  });

  it("knows a plain zero where zero is in range", () => {
    expect(numberInRange(0, ARMOUR_CLASS, "as printed", ROUTE).isKnown).toBe(true);
  });

  it("keeps the working and the route of a number it knows", () => {
    const route = new Online();
    const value = numberInRange(16, ARMOUR_CLASS, "10 + DEX 4 + WIS 2 = 16", route);
    expect([value.explanation, value.route]).toEqual(["10 + DEX 4 + WIS 2 = 16", route]);
  });

  it("says in plain words what range a number it does not know has to be in, and keeps the route", () => {
    const value = numberInRange(31, SCORE, "as printed", ROUTE);
    expect([value.explanation, value.route]).toEqual(["An ability score has to be a whole number from 1 to 30.", ROUTE]);
  });
});
