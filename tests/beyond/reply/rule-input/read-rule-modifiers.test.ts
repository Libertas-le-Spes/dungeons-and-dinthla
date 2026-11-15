import { describe, expect, it } from "vitest";
import { ruleModifiersOf } from "../../../../src/beyond/reply/rule-input/modifiers/read-rule-modifiers";
import { MadeUpReply } from "../../builders/made-up-reply";

function modifier(type: string, subType: unknown, componentId: number | null, extra: Record<string, unknown>): Record<string, unknown> {
  return { type, subType, value: 1, restriction: "", requiresAttunement: false, componentId, ...extra };
}

function bare(): MadeUpReply {
  return MadeUpReply.levelOneMonk().with(["modifiers"], { race: [], class: [], background: [], item: [], feat: [], condition: [] });
}

function carried(changes: Record<string, unknown>, definitionId: number, canAttune = false): Record<string, unknown> {
  return { quantity: 1, equipped: false, isAttuned: false, ...changes, definition: { id: definitionId, name: "Pale Charm", canAttune, armorTypeId: null, armorClass: null, strengthRequirement: null } };
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
    const reply = bare().with(["modifiers", "race"], [modifier("bonus", "speed", 600, {})]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|Quick Learner|true"]);
  });

  it("names a class modifier by a feature of the subclass, which the class lists with the rest", () => {
    const reply = bare()
      .with(["classes", 0, "classFeatures"], [{ definition: { id: 950, name: "Open Hand Technique", requiredLevel: 3 } }])
      .with(["modifiers", "class"], [modifier("bonus", "speed", 950, {})]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|Open Hand Technique|true"]);
  });

  it.each(["race", "class", "background", "feat", "condition"])("names a %s modifier whose component is not found, by the kind of source", (key) => {
    const reply = bare().with(["modifiers", key], [modifier("bonus", "speed", 31337, {})]);
    expect(readOf(reply)).toEqual([`bonus|speed|1|${key}|true`]);
  });

  it.each(["race", "class", "background", "feat", "condition"])("names a %s modifier with no component by the kind of source", (key) => {
    const reply = bare().with(["modifiers", key], [modifier("bonus", "speed", null, {})]);
    expect(readOf(reply)).toEqual([`bonus|speed|1|${key}|true`]);
  });

  it("names a background modifier whose reply has no background by the kind of source", () => {
    const reply = bare().with(["background"], null).with(["modifiers", "background"], [modifier("bonus", "speed", 800, {})]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|background|true"]);
  });

  it("names a background modifier whose background has no definition by the kind of source", () => {
    const reply = bare().with(["background"], { definition: null }).with(["modifiers", "background"], [modifier("bonus", "speed", 800, {})]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|background|true"]);
  });

  it("reads a class that lists no features and a race that lists no traits", () => {
    const reply = bare().without(["classes", 0, "classFeatures"]).without(["race", "racialTraits"]).with(["modifiers", "class"], [modifier("bonus", "speed", 900, {})]);
    expect(readOf(reply)).toEqual(["bonus|speed|1|class|true"]);
  });

  it("reads a value that is not a number as null, and a restriction that is missing as none", () => {
    const reply = bare().with(["modifiers", "feat"], [{ type: "bonus", subType: "speed", value: "3", componentId: 700 }]);
    expect(ruleModifiersOf(reply.reader()).map((found) => [found.value, found.restriction])).toEqual([[null, ""]]);
  });

  it("reads a restriction as the text it holds", () => {
    const reply = bare().with(["modifiers", "feat"], [modifier("bonus", "speed", 700, { restriction: "while raging" })]);
    expect(ruleModifiersOf(reply.reader()).map((found) => found.restriction)).toEqual(["while raging"]);
  });

  it.each([null, undefined, "", "  "])("leaves out a modifier whose subtype is %j, which no rule can touch", (subType) => {
    const reply = bare().with(["modifiers", "feat"], [modifier("bonus", subType, 700, {}), modifier("bonus", "speed", 700, {})]);
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
    const reply = bare().with(["modifiers", "feat"], [modifier("set", "unarmored-armor-class", 700, { statId })]);
    expect(ruleModifiersOf(reply.reader()).map((found) => found.ability)).toEqual([ability]);
  });

  it("refuses a modifier with no type", () => {
    const reply = bare().with(["modifiers", "feat"], [{ subType: "speed" }]);
    expect(() => ruleModifiersOf(reply.reader())).toThrow('"type" is missing or is not text');
  });

  it("refuses more modifiers in a list than the limit", () => {
    const many = Array.from({ length: 2_001 }, () => modifier("bonus", "speed", 700, {}));
    expect(() => ruleModifiersOf(bare().with(["modifiers", "feat"], many).reader())).toThrow("The list of modifiers is over the limit");
  });

  it.each(["race", "class", "background", "item", "feat", "condition"])("refuses a missing list of %s modifiers", (key) => {
    expect(() => ruleModifiersOf(bare().without(["modifiers", key]).reader())).toThrow(`"${key}" is missing or is not a list`);
  });

  describe("an item's modifiers", () => {
    function withItem(changes: Record<string, unknown>, canAttune: boolean): MadeUpReply {
      return bare().with(["inventory"], [carried(changes, 77, canAttune)]).with(["modifiers", "item"], [modifier("bonus", "armor-class", 77, {})]);
    }

    it("are in force when the item is equipped and needs no attunement", () => {
      expect(readOf(withItem({ equipped: true }, false))).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are not in force when the item is not equipped", () => {
      expect(readOf(withItem({ equipped: false, isAttuned: true }, false))).toEqual(["bonus|armor-class|1|Pale Charm|false"]);
    });

    it("are not in force when the item needs attunement and is not attuned", () => {
      expect(readOf(withItem({ equipped: true, isAttuned: false }, true))).toEqual(["bonus|armor-class|1|Pale Charm|false"]);
    });

    it("are in force when the item needs attunement and is attuned", () => {
      expect(readOf(withItem({ equipped: true, isAttuned: true }, true))).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are in force when any one copy of the item is worn", () => {
      const reply = bare()
        .with(["inventory"], [carried({ equipped: false }, 77), carried({ equipped: true }, 77)])
        .with(["modifiers", "item"], [modifier("bonus", "armor-class", 77, {})]);
      expect(readOf(reply)).toEqual(["bonus|armor-class|1|Pale Charm|true"]);
    });

    it("are marked unreadable, by the kind of source, when no item in the inventory matches", () => {
      const reply = bare().with(["modifiers", "item"], [modifier("bonus", "armor-class", 99, {})]);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("are marked unreadable when the modifier names no component", () => {
      const reply = bare().with(["modifiers", "item"], [modifier("bonus", "armor-class", null, {})]);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("are skipped for an inventory entry whose definition has no id", () => {
      const reply = bare().with(["inventory"], [carried({}, 77)]).with(["inventory", 0, "definition", "id"], null).with(["modifiers", "item"], [modifier("bonus", "armor-class", 77, {})]);
      expect(readOf(reply)).toEqual(["unreadable|armor-class|null|item|true"]);
    });

    it("refuse an inventory entry that does not say whether its item can be attuned", () => {
      const reply = withItem({ equipped: true }, false).with(["inventory", 0, "definition", "canAttune"], "no");
      expect(() => ruleModifiersOf(reply.reader())).toThrow('"canAttune" is missing or is not true or false');
    });
  });

  it("adds a modifier on armor class for an equipped item whose armor type it does not know", () => {
    const reply = bare().with(["inventory"], [carried({ equipped: true }, 5)]).with(["inventory", 0, "definition", "armorTypeId"], 9);
    expect(readOf(reply)).toEqual(["unreadable|armor-class|null|Pale Charm|true"]);
  });
});
