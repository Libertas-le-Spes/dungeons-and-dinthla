import { describe, expect, it } from "vitest";
import { scoreInputsOf } from "../../../../../src/beyond/reply/rule-input/scores/read-scores";
import type { ByAbility } from "../../../../../src/beyond/rules/input/by-ability";
import { ABILITIES, STRENGTH, DEXTERITY } from "../../../../../src/beyond/rules/input/ability";
import { MadeUpReply } from "../../../builders/made-up-reply";

const UNEXPECTED = "Scores unreadable.";
const SIX = [1, 2, 3, 4, 5, 6];

function tableOf(table: ByAbility<number>): (number | undefined)[] {
  return ABILITIES.map((ability) => table.get(ability));
}

function overrides(...entries: unknown[]): MadeUpReply {
  return MadeUpReply.levelOneMonk().with(["overrideStats"], entries);
}

function doubtNames(reply: MadeUpReply): string[] {
  return scoreInputsOf(reply.reader()).doubts.map((doubt) => doubt.name);
}

describe("scoreInputsOf", () => {
  it("takes the base scores by ability, in order", () => {
    expect(tableOf(scoreInputsOf(MadeUpReply.levelOneMonk().reader()).base)).toEqual([10, 16, 12, 8, 14, 10]);
  });

  it("takes a null bonus as no bonus, and a bonus as it is", () => {
    const reply = MadeUpReply.levelOneMonk().with(["bonusStats", 1, "value"], 2);
    expect(tableOf(scoreInputsOf(reply.reader()).bonus)).toEqual([0, 2, 0, 0, 0, 0]);
  });

  it("leaves a bonus out when its entry holds no value at all, so the engine says it is missing", () => {
    const reply = MadeUpReply.levelOneMonk().with(["bonusStats"], [{ id: 1 }, { id: 2, value: 1 }]);
    expect(tableOf(scoreInputsOf(reply.reader()).bonus)).toEqual([undefined, 1, undefined, undefined, undefined, undefined]);
  });

  it("leaves a base out when its value is null", () => {
    const reply = MadeUpReply.levelOneMonk().with(["stats", 0, "value"], null);
    expect(scoreInputsOf(reply.reader()).base.get(STRENGTH)).toBeUndefined();
  });

  it("holds no overrides when none is set", () => {
    expect(tableOf(scoreInputsOf(MadeUpReply.levelOneMonk().reader()).overrides)).toEqual(Array(6).fill(undefined));
  });

  it.each(SIX)("takes the override with id %i as that ability and no other", (id) => {
    const found = tableOf(scoreInputsOf(overrides({ id, value: 17 }).reader()).overrides);
    expect(found.filter((value) => value === 17)).toHaveLength(1);
    expect(found[id - 1]).toBe(17);
  });

  it("takes an override with no value as no override", () => {
    expect(scoreInputsOf(overrides({ id: 2 }).reader()).overrides.get(DEXTERITY)).toBeUndefined();
  });

  it("ignores an id that names no ability", () => {
    const found = scoreInputsOf(overrides({ id: 7, value: 12 }, { id: 0, value: 12 }).reader());
    expect(found.doubts).toEqual([]);
    expect(tableOf(found.overrides)).toEqual(Array(6).fill(undefined));
  });

  it("raises no doubt for a reply in the expected form", () => {
    expect(scoreInputsOf(MadeUpReply.levelOneMonk().reader()).doubts).toEqual([]);
  });

  it.each(["1", null, 1.5, [1], {}, true])("doubts all six scores and holds no table when an override's id is %j", (id) => {
    const found = scoreInputsOf(overrides({ id, value: 12 }, { id: 2, value: 13 }).reader());
    expect(found.doubts.map((doubt) => doubt.value.explanation)).toEqual(Array(6).fill(UNEXPECTED));
    expect(tableOf(found.overrides)).toEqual(Array(6).fill(undefined));
    expect(tableOf(found.base)).toEqual(Array(6).fill(undefined));
    expect(tableOf(found.bonus)).toEqual(Array(6).fill(undefined));
  });

  it("names the six scores in the doubts, by their short names", () => {
    expect(doubtNames(overrides({ value: 12 }))).toEqual(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
  });

  it("doubts the scores when an entry is not an object", () => {
    expect(doubtNames(overrides(5))).toHaveLength(6);
  });

  it.each(["12", true, [12], {}, Infinity])("doubts the scores when an override's value is %j", (value) => {
    expect(doubtNames(overrides({ id: 1, value }))).toHaveLength(6);
  });

  it.each(["stats", "bonusStats"])("doubts the scores when an entry of %s has no id", (key) => {
    expect(doubtNames(MadeUpReply.levelOneMonk().with([key], [{ value: 3 }]))).toHaveLength(6);
  });

  it.each(["stats", "bonusStats"])("doubts the scores when a value in %s is not a number", (key) => {
    expect(doubtNames(MadeUpReply.levelOneMonk().with([key], [{ id: 1, value: "3" }]))).toHaveLength(6);
  });

  it.each(["stats", "bonusStats", "overrideStats"])("refuses an ability listed twice in %s", (key) => {
    const reply = MadeUpReply.levelOneMonk().with([key], [{ id: 1, value: 12 }, { id: 1, value: 13 }]);
    expect(() => scoreInputsOf(reply.reader())).toThrow("sets the same ability twice");
  });

  it.each([
    ["stats", "The list of base scores is over the limit of 6 scores."],
    ["bonusStats", "The list of score bonuses is over the limit of 6 bonuses."],
    ["overrideStats", "The list of ability overrides is over the limit of 6 overrides."],
  ])("takes six entries of %s and refuses seven", (key, words) => {
    const six = SIX.map((id) => ({ id, value: 10 }));
    expect(() => scoreInputsOf(MadeUpReply.levelOneMonk().with([key], six).reader())).not.toThrow();
    expect(() => scoreInputsOf(MadeUpReply.levelOneMonk().with([key], [...six, { id: 1, value: 10 }]).reader())).toThrow(words);
  });

  it.each(["stats", "bonusStats", "overrideStats"])("refuses a missing list %s", (key) => {
    expect(() => scoreInputsOf(MadeUpReply.levelOneMonk().without([key]).reader())).toThrow(`"${key}" is missing or is not a list`);
  });
});
