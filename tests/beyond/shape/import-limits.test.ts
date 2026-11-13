import { describe, expect, it } from "vitest";
import {
  ABILITY_COUNT,
  ARMOUR_CLASS,
  CLASS_COUNT,
  CLASS_LEVEL,
  COIN_COUNT,
  FEATURE_COUNT,
  HIT_POINTS,
  INVENTORY_COUNT,
  ITEM_COUNT,
  MAX_HIT_POINTS,
  LINE_LENGTH,
  NAME_LENGTH,
  NUMBER_COUNT,
  REPLY_DEPTH,
  REPLY_SIZE,
  SCORE,
  SPEED,
  SPELL_COUNT,
  TOTAL_LEVEL,
} from "../../../src/beyond/shape/import-limits";
import { refuseAbove } from "../../../src/beyond/shape/refuse-above";

const CAPS = [
  { name: "the reply", cap: REPLY_SIZE, most: 5_000_000, unit: "bytes" },
  { name: "the reply's nesting", cap: REPLY_DEPTH, most: 32, unit: "levels" },
  { name: "a name", cap: NAME_LENGTH, most: 100, unit: "characters" },
  { name: "a line of text", cap: LINE_LENGTH, most: 300, unit: "characters" },
  { name: "the classes", cap: CLASS_COUNT, most: 20, unit: "classes" },
  { name: "the ability overrides", cap: ABILITY_COUNT, most: 6, unit: "overrides" },
  { name: "the numbers", cap: NUMBER_COUNT, most: 100, unit: "numbers" },
  { name: "the inventory", cap: INVENTORY_COUNT, most: 500, unit: "items" },
  { name: "the spells", cap: SPELL_COUNT, most: 500, unit: "spells" },
  { name: "the features", cap: FEATURE_COUNT, most: 500, unit: "features" },
];

const RANGES = [
  { name: "an ability score", range: SCORE, lowest: 1, highest: 30 },
  { name: "armor class", range: ARMOUR_CLASS, lowest: 0, highest: 40 },
  { name: "hit points", range: HIT_POINTS, lowest: 0, highest: 9_999 },
  { name: "maximum hit points", range: MAX_HIT_POINTS, lowest: 1, highest: 9_999 },
  { name: "a class level", range: CLASS_LEVEL, lowest: 1, highest: 20 },
  { name: "the total level", range: TOTAL_LEVEL, lowest: 1, highest: 40 },
  { name: "speed", range: SPEED, lowest: 0, highest: 500 },
  { name: "a coin count", range: COIN_COUNT, lowest: 0, highest: 1_000_000 },
  { name: "an item count", range: ITEM_COUNT, lowest: 0, highest: 9_999 },
];

describe("the caps", () => {
  it.each(CAPS)("hold $name at its most and its unit", ({ cap, most, unit }) => {
    expect([cap.most, cap.unit]).toEqual([most, unit]);
  });

  it.each(CAPS)("take $name exactly at the cap", ({ cap, most }) => {
    expect(() => refuseAbove(cap, most)).not.toThrow();
  });

  it.each(CAPS)("refuse $name one over the cap", ({ cap, most }) => {
    expect(() => refuseAbove(cap, most + 1)).toThrow();
  });
});

describe("the sane ranges", () => {
  it.each(RANGES)("hold $name at its edges", ({ range, lowest, highest }) => {
    expect([range.lowest, range.highest]).toEqual([lowest, highest]);
  });
});
