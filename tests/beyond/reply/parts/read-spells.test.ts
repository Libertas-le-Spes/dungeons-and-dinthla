import { describe, expect, it } from "vitest";
import { spellsOf } from "../../../../src/beyond/reply/parts/read-spells";
import { MadeUpReply } from "../../builders/made-up-reply";

function spell(name: unknown): object {
  return { definition: { name } };
}

function spells(count: number): object[] {
  return Array.from({ length: count }, () => spell("Light"));
}

function reply(): MadeUpReply {
  return MadeUpReply.levelOneMonk();
}

const SOURCES = ["race", "class", "background", "item", "feat"];

describe("spellsOf", () => {
  it("reads the spells of the sources, then of the classes", () => {
    expect(spellsOf(reply().reader())).toEqual(["Light", "Mage Hand"]);
  });

  it("reads the five sources in their order", () => {
    const sources = { race: [spell("Race")], class: [spell("Class")], background: [spell("Background")], item: [spell("Item")], feat: [spell("Feat")] };
    expect(spellsOf(reply().with(["spells"], sources).with(["classSpells"], []).reader())).toEqual(["Race", "Class", "Background", "Item", "Feat"]);
  });

  it("reads the spells of every class", () => {
    const classes = [{ spells: [spell("First")] }, { spells: [spell("Second"), spell("Third")] }];
    expect(spellsOf(reply().with(["spells", "item"], null).with(["classSpells"], classes).reader())).toEqual(["First", "Second", "Third"]);
  });

  it("reads no spells when every source is null and no class has any", () => {
    expect(spellsOf(reply().with(["spells", "item"], null).with(["classSpells"], []).reader())).toEqual([]);
  });

  it("lists a spell twice when two sources give it", () => {
    expect(spellsOf(reply().with(["spells", "race"], [spell("Light")]).reader())).toEqual(["Light", "Light", "Mage Hand"]);
  });

  it("refuses missing spells", () => {
    expect(() => spellsOf(reply().without(["spells"]).reader())).toThrow('"spells" is missing or is not an object');
  });

  it.each([[], "Light", 5, null])("refuses spells given as %j", (value) => {
    expect(() => spellsOf(reply().with(["spells"], value).reader())).toThrow("not an object");
  });

  it.each(SOURCES)("refuses a missing %s source", (source) => {
    expect(() => spellsOf(reply().without(["spells", source]).reader())).toThrow(`"${source}" is missing or is not a list`);
  });

  it.each(SOURCES)("refuses the %s source given as something that is not a list", (source) => {
    expect(() => spellsOf(reply().with(["spells", source], { definition: { name: "Light" } }).reader())).toThrow("not a list");
    expect(() => spellsOf(reply().with(["spells", source], "Light").reader())).toThrow("not a list");
  });

  it("refuses missing class spells", () => {
    expect(() => spellsOf(reply().without(["classSpells"]).reader())).toThrow('"classSpells" is missing or is not a list');
  });

  it("refuses a class entry with no spells list", () => {
    expect(() => spellsOf(reply().with(["classSpells"], [{}]).reader())).toThrow('"spells" is missing or is not a list');
  });

  it("refuses a spell with no name or a name that is not text", () => {
    expect(() => spellsOf(reply().with(["spells", "item"], [{ definition: {} }]).reader())).toThrow('"name" is missing');
    expect(() => spellsOf(reply().with(["classSpells"], [{ spells: [spell(null)] }]).reader())).toThrow("not text");
  });

  it("makes a spell name inert for a note", () => {
    expect(spellsOf(reply().with(["spells", "item"], [spell("[[Light]]")]).reader())).toContain("\\[\\[Light\\]\\]");
  });

  it("takes 500 spells from one source and refuses 501", () => {
    expect(spellsOf(reply().with(["spells", "item"], spells(500)).with(["classSpells"], []).reader())).toHaveLength(500);
    expect(() => spellsOf(reply().with(["spells", "item"], spells(501)).reader())).toThrow("The list of spells is over the limit of 500 spells.");
  });

  it("refuses 501 spells from one class", () => {
    expect(() => spellsOf(reply().with(["classSpells"], [{ spells: spells(501) }]).reader())).toThrow("The list of spells is over the limit of 500 spells.");
  });

  it("refuses 501 spells spread over several places, each place under the cap", () => {
    const sources = { race: spells(300), class: null, background: null, item: spells(201), feat: null };
    expect(() => spellsOf(reply().with(["spells"], sources).with(["classSpells"], []).reader())).toThrow("The list of spells is over the limit of 500 spells.");
  });

  it("refuses more than 20 class entries", () => {
    const classes = Array.from({ length: 21 }, () => ({ spells: [] }));
    expect(() => spellsOf(reply().with(["classSpells"], classes).reader())).toThrow("The list of classes is over the limit of 20 classes.");
  });
});
