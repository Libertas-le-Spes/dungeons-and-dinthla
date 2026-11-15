import { describe, expect, it } from "vitest";
import { ruleItemsOf } from "../../../../src/beyond/reply/rule-input/items/read-rule-items";
import { unreadableArmourOf } from "../../../../src/beyond/reply/rule-input/items/unreadable-armour";
import { MadeUpReply } from "../../builders/made-up-reply";

function entryOf(changes: Record<string, unknown>, definition: Record<string, unknown>): Record<string, unknown> {
  return {
    quantity: 1,
    equipped: true,
    isAttuned: false,
    ...changes,
    definition: { id: 1, name: "Test Armour", canAttune: false, armorTypeId: 2, armorClass: 14, strengthRequirement: null, ...definition },
  };
}

function itemsOf(entry: Record<string, unknown>) {
  return ruleItemsOf(MadeUpReply.levelOneMonk().with(["inventory"], [entry]).reader());
}

describe("ruleItemsOf", () => {
  it("takes every item of the inventory in order, as not armour", () => {
    const found = ruleItemsOf(MadeUpReply.levelOneMonk().reader());
    expect(found.map((item) => [item.name.text, item.armour.label, item.equipped])).toEqual([
      ["Quarterstaff", "not armour", false],
      ["Rope", "not armour", false],
      ["Torch", "not armour", false],
    ]);
  });

  it.each([
    [1, "light armour"],
    [2, "medium armour"],
    [3, "heavy armour"],
    [4, "shield"],
  ])("takes the armor type %i as %s", (armorTypeId, label) => {
    expect(itemsOf(entryOf({}, { armorTypeId })).map((item) => item.armour.label)).toEqual([label]);
  });

  it("takes armor type null as not armour", () => {
    expect(itemsOf(entryOf({}, { armorTypeId: null })).map((item) => item.armour.label)).toEqual(["not armour"]);
  });

  it.each([9, 0, "2", true])("takes the armor type %j it does not know as not armour, which the unreadable modifier then flags", (armorTypeId) => {
    expect(itemsOf(entryOf({}, { armorTypeId })).map((item) => item.armour.label)).toEqual(["not armour"]);
  });

  it("takes the armor class, the equipped and attuned flags and the need to attune", () => {
    const [item] = itemsOf(entryOf({ equipped: false, isAttuned: true }, { armorClass: 16, canAttune: true }));
    expect(item).toMatchObject({ armourClass: 16, equipped: false, attuned: true, needsAttunement: true });
  });

  it("makes an armor class that is not a number not a number", () => {
    expect(itemsOf(entryOf({}, { armorClass: null }))[0]?.armourClass).toBeNaN();
  });

  it("takes no strength requirement as zero and a requirement as it is", () => {
    expect(itemsOf(entryOf({}, { strengthRequirement: null }))[0]?.strengthRequired).toBe(0);
    expect(itemsOf(entryOf({}, { strengthRequirement: 13 }))[0]?.strengthRequired).toBe(13);
  });

  it("makes a strength requirement that is not a number not a number", () => {
    expect(itemsOf(entryOf({}, { strengthRequirement: "13" }))[0]?.strengthRequired).toBeNaN();
  });

  it.each(["equipped", "isAttuned"])("refuses an item whose %s is not true or false", (key) => {
    expect(() => itemsOf(entryOf({ [key]: "yes" }, {}))).toThrow(`The reply's "${key}" is missing or is not true or false.`);
  });

  it("refuses an item definition whose canAttune is not true or false", () => {
    expect(() => itemsOf(entryOf({}, { canAttune: null }))).toThrow('"canAttune" is missing or is not true or false');
  });
});

describe("unreadableArmourOf", () => {
  function unreadable(entry: Record<string, unknown>): string[] {
    return unreadableArmourOf(MadeUpReply.levelOneMonk().with(["inventory"], [entry]).reader()).map((modifier) => `${modifier.type}|${modifier.subType.text}|${modifier.sourceName.text}|${modifier.inForce}`);
  }

  it("flags an equipped item whose armor type it does not know, on armor class, by the item's name", () => {
    expect(unreadable(entryOf({}, { armorTypeId: 9 }))).toEqual(["unreadable|armor-class|Test Armour|true"]);
  });

  it("flags nothing for an item it does not wear", () => {
    expect(unreadable(entryOf({ equipped: false }, { armorTypeId: 9 }))).toEqual([]);
  });

  it.each([1, 2, 3, 4, null])("flags nothing for the armor type %j", (armorTypeId) => {
    expect(unreadable(entryOf({}, { armorTypeId }))).toEqual([]);
  });
});
