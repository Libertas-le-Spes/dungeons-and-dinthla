import { describe, expect, it } from "vitest";
import { scoresOf } from "../../../../src/beyond/reply/parts/read-scores";
import type { AbilityScores } from "../../../../src/beyond/shape/ability-scores";
import { MadeUpReply } from "../../builders/made-up-reply";

const ABILITIES: { id: number; key: keyof AbilityScores; label: string }[] = [
  { id: 1, key: "strength", label: "Strength" },
  { id: 2, key: "dexterity", label: "Dexterity" },
  { id: 3, key: "constitution", label: "Constitution" },
  { id: 4, key: "intelligence", label: "Intelligence" },
  { id: 5, key: "wisdom", label: "Wisdom" },
  { id: 6, key: "charisma", label: "Charisma" },
];

function overrides(...entries: object[]): MadeUpReply {
  return MadeUpReply.levelOneMonk().with(["overrideStats"], entries);
}

describe("scoresOf", () => {
  it.each(ABILITIES)("marks $key not known when D&D Beyond holds no override for it, and says what it states", ({ key }) => {
    const found = scoresOf(MadeUpReply.levelOneMonk().reader())[key];
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toContain("states only the base score");
    expect(found.route.name).toBe("online");
  });

  it.each(ABILITIES)("takes the override with id $id as $key and no other score", ({ id, key, label }) => {
    const scores = scoresOf(overrides({ id, value: 17 }).reader());
    expect(scores[key].valueOr(0)).toBe(17);
    expect(scores[key].explanation).toBe(`${label} set on D&D Beyond: 17`);
    const others = ABILITIES.filter((ability) => ability.key !== key);
    expect(others.map((other) => scores[other.key].isKnown)).toEqual(Array(5).fill(false));
  });

  it("does not take a base score or a bonus as the score", () => {
    const reply = MadeUpReply.levelOneMonk().with(["stats", 0, "value"], 15).with(["bonusStats", 0, "value"], 2);
    expect(scoresOf(reply.reader()).strength.isKnown).toBe(false);
  });

  it("ignores an override whose value is null, as an ability with no override", () => {
    const found = scoresOf(overrides({ id: 1, value: null }).reader()).strength;
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toContain("states only the base score");
  });

  it("ignores an override with no id or no value", () => {
    const scores = scoresOf(overrides({ value: 12 }, { id: 2 }).reader());
    expect(scores.strength.isKnown).toBe(false);
    expect(scores.dexterity.isKnown).toBe(false);
  });

  it("ignores two overrides that have no id without taking them for the same ability", () => {
    const scores = scoresOf(overrides({ value: 12 }, { value: 13 }, { id: 3, value: 14 }).reader());
    expect(scores.constitution.valueOr(0)).toBe(14);
  });

  it.each(["1", null, 1.5, [1], {}])("ignores an override whose id is %j", (id) => {
    const scores = scoresOf(overrides({ id, value: 12 }).reader());
    expect(ABILITIES.map((ability) => scores[ability.key].isKnown)).toEqual(Array(6).fill(false));
  });

  it("ignores an override with an id that names no ability", () => {
    const scores = scoresOf(overrides({ id: 7, value: 12 }, { id: 0, value: 12 }).reader());
    expect(ABILITIES.map((ability) => scores[ability.key].isKnown)).toEqual(Array(6).fill(false));
  });

  it.each([1, 30])("takes the override %i at the edge of the range", (value) => {
    expect(scoresOf(overrides({ id: 1, value }).reader()).strength.valueOr(0)).toBe(value);
  });

  it.each([0, 31, -4, 12.5, "12", true, [12]])("marks the override value %j not known", (value) => {
    expect(scoresOf(overrides({ id: 1, value }).reader()).strength.isKnown).toBe(false);
  });

  it("marks only the badly valued override not known", () => {
    const scores = scoresOf(overrides({ id: 1, value: 99 }, { id: 2, value: 14 }).reader());
    expect(scores.strength.isKnown).toBe(false);
    expect(scores.dexterity.valueOr(0)).toBe(14);
  });

  it("refuses an ability set twice", () => {
    expect(() => scoresOf(overrides({ id: 1, value: 12 }, { id: 1, value: 13 }).reader())).toThrow("sets the same ability twice");
  });

  it("takes six overrides and refuses seven", () => {
    const six = ABILITIES.map((ability) => ({ id: ability.id, value: 10 }));
    expect(scoresOf(overrides(...six).reader()).charisma.valueOr(0)).toBe(10);
    expect(() => scoresOf(overrides(...six, { id: 1, value: 10 }).reader())).toThrow("The list of ability overrides is over the limit of 6 overrides.");
  });

  it("refuses a missing list of overrides", () => {
    expect(() => scoresOf(MadeUpReply.levelOneMonk().without(["overrideStats"]).reader())).toThrow('"overrideStats" is missing or is not a list');
  });

  it("refuses overrides given as an object", () => {
    expect(() => scoresOf(MadeUpReply.levelOneMonk().with(["overrideStats"], { 1: 12 }).reader())).toThrow("not a list");
  });
});
