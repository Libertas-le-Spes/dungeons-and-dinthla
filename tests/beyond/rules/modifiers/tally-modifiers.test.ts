import { describe, expect, it } from "vitest";
import { ConditionalSubTypes } from "../../../../src/beyond/rules/modifiers/handlers/conditional-sub-types";
import { SubTypeFamily } from "../../../../src/beyond/rules/modifiers/sub-type-family";
import { standardHandlers } from "../../../../src/beyond/rules/modifiers/standard-handlers";
import { tallyModifiers } from "../../../../src/beyond/rules/modifiers/tally-modifiers";
import { modifierOf } from "../../builders/made-up-rule-character";

const FAMILY = new SubTypeFamily(["stealth"], ["armor-class"]);
const HANDLERS = standardHandlers(["stealth"]);

describe("tallyModifiers", () => {
  it("adds a plain bonus and keeps its source", () => {
    const tally = tallyModifiers([modifierOf("bonus", "stealth", 2, "Boots")], FAMILY, HANDLERS);
    expect([tally.added, tally.applied, tally.conditional, tally.unknown]).toEqual([2, ["Boots 2"], [], []]);
  });

  it("adds two plain bonuses together", () => {
    const tally = tallyModifiers([modifierOf("bonus", "stealth", 2, "Boots"), modifierOf("bonus", "stealth", 1, "Hood")], FAMILY, HANDLERS);
    expect(tally.added).toBe(3);
  });

  it("does not touch a modifier of another sub-type", () => {
    const tally = tallyModifiers([modifierOf("set", "arcana", 20, "Pale Charm")], FAMILY, HANDLERS);
    expect(tally.unknown).toEqual([]);
  });

  it("touches a modifier whose sub-type holds a stem of the family", () => {
    const tally = tallyModifiers([modifierOf("set", "unarmored-armor-class", 20, "Pale Charm")], FAMILY, HANDLERS);
    expect(tally.unknown).toEqual(["unarmored-armor-class"]);
  });

  it("notes a modifier it does not handle as unknown, with its sub-type", () => {
    const tally = tallyModifiers([modifierOf("set", "stealth", 20, "Pale Charm")], FAMILY, HANDLERS);
    expect(tally.unknown).toEqual(["stealth"]);
  });

  it("notes a bonus with no value as unknown", () => {
    const tally = tallyModifiers([modifierOf("bonus", "stealth", null, "Boots")], FAMILY, HANDLERS);
    expect(tally.unknown).toEqual(["stealth"]);
  });

  it("notes a bonus whose restriction is only spaces as plain, and one with words as conditional", () => {
    const tally = tallyModifiers([modifierOf("bonus", "stealth", 1, "Boots", "   "), modifierOf("bonus", "stealth", 4, "Hood", "in dim light")], FAMILY, HANDLERS);
    expect([tally.added, tally.conditional]).toEqual([1, ["Hood"]]);
  });

  it("ignores a modifier whose source does not apply now before anything else", () => {
    const unworn = { ...modifierOf("set", "stealth", 20, "Pale Charm"), appliesNow: false };
    expect(tallyModifiers([unworn], FAMILY, HANDLERS).unknown).toEqual([]);
  });

  it("ignores advantage and disadvantage", () => {
    const tally = tallyModifiers([modifierOf("advantage", "stealth", null, "Cloak"), modifierOf("disadvantage", "stealth", null, "Plate")], FAMILY, HANDLERS);
    expect([tally.added, tally.unknown]).toEqual([0, []]);
  });

  it("lists a source once when two modifiers are conditional", () => {
    const handlers = standardHandlers(["stealth"], [new ConditionalSubTypes(["stealth"])]);
    const tally = tallyModifiers([modifierOf("bonus", "stealth", 1, "Hood"), modifierOf("bonus", "stealth", 1, "Hood")], FAMILY, handlers);
    expect(tally.conditional).toEqual(["Hood"]);
  });

  it("applies an extra handler before the plain bonus", () => {
    const handlers = standardHandlers(["stealth"], [new ConditionalSubTypes(["stealth"])]);
    const tally = tallyModifiers([modifierOf("bonus", "stealth", 1, "Hood")], FAMILY, handlers);
    expect([tally.added, tally.conditional]).toEqual([0, ["Hood"]]);
  });
});
