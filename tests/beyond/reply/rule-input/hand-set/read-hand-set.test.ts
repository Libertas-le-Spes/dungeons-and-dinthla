import { describe, expect, it } from "vitest";
import { handSetOf } from "../../../../../src/beyond/reply/rule-input/hand-set/read-hand-set";
import { MadeUpReply } from "../../../builders/made-up-reply";

function valued(fields: Record<string, unknown>): Record<string, unknown> {
  return { notes: null, valueId: null, valueTypeId: null, contextId: null, contextTypeId: null, ...fields };
}

function setBy(entries: object[]): ReturnType<typeof handSetOf> {
  return handSetOf(MadeUpReply.levelOneMonk().with(["characterValues"], entries).reader());
}

function shown(found: ReturnType<typeof handSetOf>): string[] {
  return found.setByHand.map((number) => `${number.name}|${number.value.isKnown}|${number.value.valueOr(-1)}|${number.value.explanation}`);
}

describe("handSetOf, for values set by hand", () => {
  it("holds nothing for a reply with none", () => {
    expect(handSetOf(MadeUpReply.levelOneMonk().reader())).toEqual({ setByHand: [], blankets: [] });
    expect(handSetOf(MadeUpReply.levelOneMonk().without(["characterValues"]).reader())).toEqual({ setByHand: [], blankets: [] });
  });

  it("takes the armor class set by hand, with its working", () => {
    expect(shown(setBy([valued({ typeId: 1, value: 13 })]))).toEqual(["AC|true|13|Set by hand"]);
  });

  it("takes the passive Perception set by hand", () => {
    expect(shown(setBy([valued({ typeId: 5, value: 16 })]))).toEqual(["Passive Perception|true|16|Set by hand"]);
  });

  it("takes both, and raises no blanket", () => {
    const found = setBy([valued({ typeId: 1, value: 13 }), valued({ typeId: 5, value: 16 })]);
    expect(found.setByHand).toHaveLength(2);
    expect(found.blankets).toEqual([]);
  });

  it("marks a value out of range not known", () => {
    expect(shown(setBy([valued({ typeId: 1, value: 99 })]))).toEqual(["AC|false|-1|Must be a whole number 0 to 40."]);
  });

  it.each([
    ["a kind it does not know", valued({ typeId: 2, value: 10 })],
    ["a value that is not a number", valued({ typeId: 1, value: "13" })],
    ["a kind that is not a number", valued({ typeId: "1", value: 13 })],
    ["a value value id", valued({ typeId: 1, value: 13, valueId: 4 })],
    ["a value type id", valued({ typeId: 1, value: 13, valueTypeId: 4 })],
    ["a context id", valued({ typeId: 1, value: 13, contextId: 4 })],
    ["a context type id", valued({ typeId: 1, value: 13, contextTypeId: 4 })],
  ])("raises one blanket over every number for %s", (_, entry) => {
    const found = setBy([entry, entry]);
    expect(found.blankets).toHaveLength(1);
    expect(found.blankets[0]?.covers("Athletics")).toBe(true);
    expect(found.blankets[0]?.covers("STR")).toBe(true);
    expect(found.setByHand).toEqual([]);
  });

  it.each([
    ["no value", valued({ typeId: 1, value: null })],
    ["no value at all", { typeId: 1, valueId: null }],
    ["no value, of a kind it does not know", valued({ typeId: 2, value: null })],
  ])("skips an entry with %s, a cleared value that changes nothing", (_, entry) => {
    expect(setBy([entry])).toEqual({ setByHand: [], blankets: [] });
  });

  it("keeps the values it reads when another is not read", () => {
    const found = setBy([valued({ typeId: 1, value: 13 }), valued({ typeId: 2, value: 10 })]);
    expect(shown(found)).toEqual(["AC|true|13|Set by hand"]);
    expect(found.blankets).toHaveLength(1);
  });

  it("refuses more values than the limit", () => {
    expect(() => setBy(Array(201).fill(valued({ typeId: 1, value: 13 })))).toThrow("The list of values set by hand is over the limit");
  });
});

describe("handSetOf, for proficiencies and conditions added by hand", () => {
  function covered(reply: MadeUpReply): string[] {
    const blankets = handSetOf(reply.reader()).blankets;
    const names = ["Athletics", "STR save", "Initiative", "Passive Insight", "Speed", "HP", "Current HP", "Wizard spell save DC", "Spell attack bonus", "AC", "Temporary HP", "STR"];
    return names.filter((name) => blankets.some((blanket) => blanket.covers(name)));
  }

  it("covers the skills, saves, initiative and passives, and nothing else, for a proficiency added by hand", () => {
    expect(covered(MadeUpReply.levelOneMonk().with(["customProficiencies"], [{ name: "Stealth" }]))).toEqual(["Athletics", "STR save", "Initiative", "Passive Insight"]);
  });

  it("covers those, the speed, the hit points and the spell numbers for a condition", () => {
    expect(covered(MadeUpReply.levelOneMonk().with(["conditions"], [{ id: 4, level: 1 }]))).toEqual(["Athletics", "STR save", "Initiative", "Passive Insight", "Speed", "HP", "Current HP", "Wizard spell save DC", "Spell attack bonus"]);
  });

  it("covers nothing when none is listed, or the reply does not list them", () => {
    expect(covered(MadeUpReply.levelOneMonk().with(["customProficiencies"], []).with(["conditions"], []))).toEqual([]);
    expect(covered(MadeUpReply.levelOneMonk().without(["customProficiencies"]).without(["conditions"]))).toEqual([]);
  });

  it("gives the reason of each in words", () => {
    const reply = MadeUpReply.levelOneMonk().with(["customProficiencies"], [{}]).with(["conditions"], [{}]);
    expect(handSetOf(reply.reader()).blankets.map((blanket) => blanket.reason)).toEqual([
      "Proficiencies set by hand. Type them on your note.",
      "A condition applies. Type them on your note.",
    ]);
  });

  it("refuses more proficiencies, or conditions, than the limit", () => {
    expect(() => handSetOf(MadeUpReply.levelOneMonk().with(["customProficiencies"], Array(201).fill({})).reader())).toThrow("over the limit");
    expect(() => handSetOf(MadeUpReply.levelOneMonk().with(["conditions"], Array(51).fill({})).reader())).toThrow("over the limit");
  });
});
