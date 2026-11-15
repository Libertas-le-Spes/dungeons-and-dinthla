import { describe, expect, it } from "vitest";
import { ruleModifiersOf } from "../../../../../src/beyond/reply/rule-input/modifiers/read-rule-modifiers";
import { MadeUpReply } from "../../../builders/made-up-reply";

function modifier(fields: Record<string, unknown>): Record<string, unknown> {
  return { value: 1, restriction: "", requiresAttunement: false, ...fields };
}

function bare(): MadeUpReply {
  return MadeUpReply.levelOneMonk().with(["modifiers"], { race: [], class: [], background: [], item: [], feat: [], condition: [] });
}

interface CarriedFields {
  readonly id: number;
  readonly canAttune: boolean;
  readonly equipped: boolean;
  readonly isAttuned: boolean;
}

function carried(fields: CarriedFields): Record<string, unknown> {
  const { id, canAttune, ...held } = fields;
  return { quantity: 1, ...held, definition: { id, name: "Pale Charm", canAttune, armorTypeId: null, armorClass: null, strengthRequirement: null } };
}

function readOf(reply: MadeUpReply): string[] {
  return ruleModifiersOf(reply.reader()).map((found) => `${found.type}|${found.subType.text}|${found.value}|${found.sourceName.text}|${found.inForce}`);
}

describe("ruleModifiersOf", () => {
  it("reads the made-up monk's modifiers with the names of the features and feats they come from", () => {
    expect(readOf(MadeUpReply.levelOneMonk())).toEqual([
      "set|unarmored-armor-class|null|Unarmored Defense|true",
      "proficiency|dexterity-saving-throws|null|Unarmored Defense|true",
      "proficiency|acrobatics|null|Unarmored Defense|true",
      "proficiency|insight|null|Hermit|true",
      "bonus|intelligence-score|1|Alert|true",
    ]);
  });

  it("names a race modifier by the racial trait it comes from", () => {
    const reply = bare().with(["modifiers", "race"], [modifier({ type: "bonus", subType: "speed", componentId: 600 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|Quick Learner|true"]);
  });

  it("names a class modifier by a feature of the subclass, which the class lists with the rest", () => {
    const reply = bare()
      .with(["classes", 0, "classFeatures"], [{ definition: { id: 950, name: "Open Hand Technique", requiredLevel: 3 } }])
      .with(["modifiers", "class"], [modifier({ type: "bonus", subType: "speed", componentId: 950 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|Open Hand Technique|true"]);
  });

  it.each(["race", "class", "background", "feat", "condition"])("names a %s modifier whose component is not found, by the kind of source", (key) => {
    const reply = bare().with(["modifiers", key], [modifier({ type: "bonus", subType: "speed", componentId: 31337 })]);
    expect(readOf(reply)).toEqual([`bonus|speed|1|${key}|true`]);
  });

  it.each(["race", "class", "background", "feat", "condition"])("names a %s modifier with no component by the kind of source", (key) => {
    const reply = bare().with(["modifiers", key], [modifier({ type: "bonus", subType: "speed", componentId: null })]);
    expect(readOf(reply)).toEqual([`bonus|speed|1|${key}|true`]);
  });

  it("names a background modifier whose reply has no background by the kind of source", () => {
    const reply = bare().with(["background"], null).with(["modifiers", "background"], [modifier({ type: "bonus", subType: "speed", componentId: 800 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|background|true"]);
  });

  it("names a background modifier whose background has no definition by the kind of source", () => {
    const reply = bare().with(["background"], { definition: null }).with(["modifiers", "background"], [modifier({ type: "bonus", subType: "speed", componentId: 800 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|background|true"]);
  });

  it("reads a class that lists no features and a race that lists no traits", () => {
    const reply = bare().without(["classes", 0, "classFeatures"]).without(["race", "racialTraits"]).with(["modifiers", "class"], [modifier({ type: "bonus", subType: "speed", componentId: 900 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|class|true"]);
  });

  it("reads a value that is not a number as null, and a restriction that is missing as none", () => {
    const reply = bare().with(["modifiers", "feat"], [{ type: "bonus", subType: "speed", value: "3", componentId: 700 }]);
    expect(ruleModifiersOf(reply.reader()).map((found) => [found.value, found.restriction])).toEqual([[null, ""]]);
  });

  it("reads a restriction as the text it holds", () => {
    const reply = bare().with(["modifiers", "feat"], [modifier({ type: "bonus", subType: "speed", componentId: 700, restriction: "while raging" })]);
    expect(ruleModifiersOf(reply.reader()).map((found) => found.restriction)).toEqual(["while raging"]);
  });

  it.each([null, undefined, "", "  "])("leaves out a modifier whose subtype is %j, which no rule can touch", (subType) => {
    const reply = bare().with(["modifiers", "feat"], [modifier({ type: "bonus", subType: subType, componentId: 700 }), modifier({ type: "bonus", subType: "speed", componentId: 700 })]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|Alert|true"]);
  });

  it.each([
    [1, "STR"],
    [3, "CON"],
    [5, "WIS"],
    [6, "CHA"],
    [7, ""],
    [null, ""],
    ["5", ""],
  ])("reads the stat number %j as the ability %j, none for one that names no ability", (statId, ability) => {
    const reply = bare().with(["modifiers", "feat"], [modifier({ type: "set", subType: "unarmored-armor-class", componentId: 700, statId })]);
    expect(ruleModifiersOf(reply.reader()).map((found) => found.ability)).toEqual([ability]);
  });

  it("refuses a modifier with no type", () => {
    const reply = bare().with(["modifiers", "feat"], [{ subType: "speed" }]);
    expect(() => ruleModifiersOf(reply.reader())).toThrow('"type" is missing or is not text');
  });

  it("refuses more modifiers in a list than the limit", () => {
    const many = Array.from({ length: 2_001 }, () => modifier({ type: "bonus", subType: "speed", componentId: 700 }));
    expect(() => ruleModifiersOf(bare().with(["modifiers", "feat"], many).reader())).toThrow("The list of modifiers is over the limit");
  });

  it.each(["race", "class", "background", "item", "feat", "condition"])("refuses a missing list of %s modifiers", (key) => {
    expect(() => ruleModifiersOf(bare().without(["modifiers", key]).reader())).toThrow(`"${key}" is missing or is not a list`);
  });

  describe("an item's modifiers", () => {
    const armourBonus = modifier({ type: "bonus", subType: "armor-class", componentId: 77 });

    function withItem(fields: CarriedFields): MadeUpReply {
      return bare().with(["inventory"], [carried(fields)]).with(["modifiers", "item"], [armourBonus]);
    }

    it("are in force when the item is equipped and needs no attunement", () => {
      expect(readOf(withItem({ id: 77, canAttune: false, equipped: true, isAttuned: false }))).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are not in force when the item is not equipped", () => {
      expect(readOf(withItem({ id: 77, canAttune: false, equipped: false, isAttuned: true }))).toEqual(["bonus|armor-class|1|Pale Charm|false"]);
    });

    it("are not in force when the item needs attunement and is not attuned", () => {
      expect(readOf(withItem({ id: 77, canAttune: true, equipped: true, isAttuned: false }))).toEqual(["bonus|armor-class|1|Pale Charm|false"]);
    });

    it("are in force when the item needs attunement and is attuned", () => {
      expect(readOf(withItem({ id: 77, canAttune: true, equipped: true, isAttuned: true }))).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are in force when one of two copies of the item is worn", () => {
      const copies = [carried({ id: 77, canAttune: false, equipped: false, isAttuned: false }), carried({ id: 77, canAttune: false, equipped: true, isAttuned: false })];
      expect(readOf(bare().with(["inventory"], copies).with(["modifiers", "item"], [armourBonus]))).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are marked unreadable when two copies of the item are worn, so they are not counted twice", () => {
      const copies = [carried({ id: 77, canAttune: false, equipped: true, isAttuned: false }), carried({ id: 77, canAttune: false, equipped: true, isAttuned: false })];
      expect(readOf(bare().with(["inventory"], copies).with(["modifiers", "item"], [armourBonus]))).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("count the same modifier of an item once, and mark a repeat unreadable", () => {
      const reply = withItem({ id: 77, canAttune: false, equipped: true, isAttuned: false }).with(["modifiers", "item"], [armourBonus, armourBonus]);
      expect(readOf(reply)).toEqual(["bonus|armor-class|1|Pale Charm|true", "unreadable|armor-class|null|item|true"]);
    });

    it.each([
      ["another sub-type", { subType: "speed" }],
      ["another value", { value: 2 }],
      ["another type", { type: "set" }],
      ["another component", { componentId: 78 }],
    ])("keep a modifier that differs by %s from another of the item", (_, change) => {
      const copies = [carried({ id: 77, canAttune: false, equipped: true, isAttuned: false }), carried({ id: 78, canAttune: false, equipped: true, isAttuned: false })];
      const reply = bare().with(["inventory"], copies).with(["modifiers", "item"], [armourBonus, { ...armourBonus, ...change }]);
      expect(readOf(reply).filter((line) => line.startsWith("unreadable"))).toEqual([]);
    });

    it("are marked unreadable, by the kind of source, when no item in the inventory matches", () => {
      const reply = bare().with(["modifiers", "item"], [modifier({ type: "bonus", subType: "armor-class", componentId: 99 })]);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("are marked unreadable when the modifier names no component", () => {
      const reply = bare().with(["modifiers", "item"], [modifier({ type: "bonus", subType: "armor-class", componentId: null })]);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("are skipped for an inventory entry whose definition has no id", () => {
      const reply = withItem({ id: 77, canAttune: false, equipped: true, isAttuned: false }).with(["inventory", 0, "definition", "id"], null);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("refuse an inventory entry that does not say whether its item can be attuned", () => {
      const reply = withItem({ id: 77, canAttune: false, equipped: true, isAttuned: false }).with(["inventory", 0, "definition", "canAttune"], "no");
      expect(() => ruleModifiersOf(reply.reader())).toThrow('"canAttune" is missing or is not true or false');
    });
  });

  it("adds a modifier on armor class for an equipped item whose armor type it does not know", () => {
    const reply = bare().with(["inventory"], [carried({ id: 5, canAttune: false, equipped: true, isAttuned: false })]).with(["inventory", 0, "definition", "armorTypeId"], 9);
    expect(readOf(reply)).toEqual(["unreadable|armor-class|null|Pale Charm|true"]);
  });
});
