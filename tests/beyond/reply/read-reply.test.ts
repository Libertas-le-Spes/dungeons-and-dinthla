import { afterEach, describe, expect, it } from "vitest";
import { readReply } from "../../../src/beyond/reply/read-reply";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { BACKSTORY_MARKER, MadeUpReply, TRAIT_MARKER } from "../builders/made-up-reply";

const PROTOTYPE_KEYS = ["__proto__", "constructor", "prototype"];

const PLACES: { where: string; path: (string | number)[] }[] = [
  { where: "the data", path: [] },
  { where: "the race", path: ["race"] },
  { where: "a class", path: ["classes", 0] },
  { where: "a class definition", path: ["classes", 0, "definition"] },
  { where: "an ability override", path: ["overrideStats", 0] },
  { where: "an item", path: ["inventory", 0] },
  { where: "an item definition", path: ["inventory", 0, "definition"] },
  { where: "the purse", path: ["currencies"] },
  { where: "the spells", path: ["spells"] },
  { where: "a spell", path: ["spells", "item", 0] },
  { where: "a class spell list", path: ["classSpells", 0] },
  { where: "a feat", path: ["feats", 0] },
  { where: "the modifiers", path: ["modifiers"] },
];

function placesWithEachKey(): { where: string; path: (string | number)[]; key: string }[] {
  const found: { where: string; path: (string | number)[]; key: string }[] = [];
  for (const place of PLACES) {
    for (const key of PROTOTYPE_KEYS) found.push({ where: place.where, path: place.path, key });
  }
  return found;
}

function clean(): MadeUpReply {
  return MadeUpReply.levelOneMonk();
}

afterEach(() => {
  expect(Reflect.get({}, "polluted")).toBeUndefined();
  expect(Object.getPrototypeOf({})).toBe(Object.prototype);
});

describe("readReply", () => {
  it("reads a whole reply into the checked shape", () => {
    const { id, character } = readReply(clean().wholeText());
    expect(id).toBe(4242);
    expect(character.route.name).toBe("online");
    expect(character.name.text).toBe("Primary Monk");
    expect(character.species.text).toBe("Human");
    expect(character.classes.map((imported) => [imported.name.text, imported.level.valueOr(0)])).toEqual([["Monk", 1]]);
    expect(character.inventory.map((item) => item.name.text)).toEqual(["Quarterstaff", "Rope", "Torch"]);
    expect(character.purse.gold.valueOr(0)).toBe(15);
    expect(character.spells.map((spell) => spell.text)).toEqual(["Light", "Mage Hand"]);
    expect(character.features.map((feature) => feature.text)).toEqual(["Alert"]);
    expect(character.numbers.map((number) => number.name)).toEqual(["AC", "HP"]);
  });

  it("reads bare data the same as the whole reply", () => {
    expect(readReply(clean().bareText())).toEqual(readReply(clean().wholeText()));
  });

  it("takes the id from the data, not from the reply around it", () => {
    expect(readReply(clean().wholeText()).id).toBe(4242);
  });

  it("refuses a reply that says it failed", () => {
    expect(() => readReply(clean().wrappedText(false))).toThrow("D&D Beyond says it could not give this character.");
  });

  it("refuses the answer to an unknown character", () => {
    const missing = '{"id":0,"success":false,"message":"The resource requested was not found."}';
    expect(() => readReply(missing)).toThrow("could not give this character");
  });

  it("refuses a reply with no id in its data", () => {
    expect(() => readReply(clean().without(["id"]).wholeText())).toThrow("does not say which character it is");
  });

  it.each(["", "not json", "[]", "5", "null", '"text"', "true"])("refuses %j with a plain refusal", (text) => {
    expect(() => readReply(text)).toThrow(Refusal);
  });

  it("refuses an oversize reply", () => {
    expect(() => readReply(`"${"a".repeat(5_000_000)}"`)).toThrow("The reply is over the limit of 5000000 bytes.");
  });

  it("refuses a reply nested too deeply", () => {
    expect(() => readReply(`${"[".repeat(33)}${"]".repeat(33)}`)).toThrow("nesting is over the limit");
  });

  it("holds none of the backstory or the notes in what it returns", () => {
    const written = JSON.stringify(readReply(clean().wholeText()));
    expect(written).not.toContain(BACKSTORY_MARKER);
    expect(written).not.toContain("Secondary Monk");
    expect(written).not.toContain("backstory");
    expect(written).not.toContain("notes");
  });

  it("holds none of the personality traits in what it returns", () => {
    expect(JSON.stringify(readReply(clean().wholeText()))).not.toContain(TRAIT_MARKER);
  });

  it("holds no backstory even when it is written into an item", () => {
    const reply = clean().with(["inventory", 0, "notes"], BACKSTORY_MARKER);
    expect(JSON.stringify(readReply(reply.wholeText()))).not.toContain(BACKSTORY_MARKER);
  });

  it("reads the same character with or without the backstory and notes", () => {
    expect(readReply(clean().wholeText())).toEqual(readReply(clean().without(["notes"]).without(["traits"]).wholeText()));
  });

  it("ignores keys it does not read", () => {
    const extra = clean().with(["armorClass"], 99).with(["somethingNew"], { deeper: [1, 2] });
    expect(readReply(extra.wholeText())).toEqual(readReply(clean().wholeText()));
  });

  it.each(placesWithEachKey())("reads the same character with $key planted in $where", ({ path, key }) => {
    const hostile = clean().withHostileKey(path, key);
    expect(readReply(hostile.wholeText())).toEqual(readReply(clean().wholeText()));
  });

  it("reads the same character with every prototype key planted at the top of a whole reply", () => {
    const planted = `{"__proto__":{"polluted":true},"constructor":{"polluted":true},"success":true,"data":${clean().bareText()}}`;
    expect(readReply(planted)).toEqual(readReply(clean().wholeText()));
  });

  it("does not take a key from the prototype chain, even one named like a read field", () => {
    const text = `{"__proto__":{"name":"Planted","id":9},"success":true,"data":${clean().without(["name"]).bareText()}}`;
    expect(() => readReply(text)).toThrow('"name" is missing or is not text');
  });

  it("reads a character whose spell sources are all null", () => {
    const reply = clean().with(["spells"], { race: null, class: null, background: null, item: null, feat: null }).with(["classSpells"], []);
    expect(readReply(reply.wholeText()).character.spells).toEqual([]);
  });

  it("marks the one value not known and reads on when a number has the wrong type", () => {
    const { character } = readReply(clean().with(["currencies", "gp"], "15").wholeText());
    expect(character.purse.gold.isKnown).toBe(false);
    expect(character.purse.silver.valueOr(0)).toBe(4);
  });

  it("marks the one value not known and reads on when a number is too big for a number", () => {
    const { character } = readReply(clean().wholeText().replace('"gp":15', '"gp":1e999'));
    expect(character.purse.gold.isKnown).toBe(false);
    expect(character.purse.silver.valueOr(0)).toBe(4);
  });

  it("keeps a number out of range from becoming a value", () => {
    const { character } = readReply(clean().with(["classes", 0, "level"], 21).wholeText());
    expect(character.classes.map((imported) => imported.level.isKnown)).toEqual([false]);
  });

  it("refuses a reply when a required text has the wrong type", () => {
    expect(() => readReply(clean().with(["name"], 12).wholeText())).toThrow("not text");
  });
});
