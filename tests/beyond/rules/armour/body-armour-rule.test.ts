import { describe, expect, it } from "vitest";
import { HeavyArmour } from "../../../../src/beyond/rules/input/armour/heavy-armour";
import { LightArmour } from "../../../../src/beyond/rules/input/armour/light-armour";
import { MediumArmour } from "../../../../src/beyond/rules/input/armour/medium-armour";
import { armourClassOf, itemOf, withDexterity } from "../../builders/made-up-rule-character";

describe("BodyArmourRule with body armour", () => {
  it("adds all of a high dexterity modifier to light armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(18), items: [itemOf("Leather", new LightArmour(), 11)] })).toEqual({ value: 15, working: "Leather 11 + DEX 4 = 15, light armour" });
  });

  it("subtracts a negative dexterity modifier from light armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(8), items: [itemOf("Leather", new LightArmour(), 11)] }).value).toBe(10);
  });

  it("adds at most 2 of a high dexterity modifier to medium armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(18), items: [itemOf("Breastplate", new MediumArmour(), 14)] })).toEqual({ value: 16, working: "Breastplate 14 + DEX 2 = 16, medium armour" });
  });

  it("adds a dexterity modifier of 2 to medium armour in full", () => {
    expect(armourClassOf({ baseScores: withDexterity(14), items: [itemOf("Breastplate", new MediumArmour(), 14)] }).value).toBe(16);
  });

  it("adds a dexterity modifier of 1 to medium armour in full", () => {
    expect(armourClassOf({ baseScores: withDexterity(12), items: [itemOf("Breastplate", new MediumArmour(), 14)] }).value).toBe(15);
  });

  it("subtracts a negative dexterity modifier from medium armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(8), items: [itemOf("Breastplate", new MediumArmour(), 14)] }).value).toBe(13);
  });

  it("adds none of a high dexterity modifier to heavy armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(18), items: [itemOf("Chain Mail", new HeavyArmour(), 16)] })).toEqual({ value: 16, working: "Chain Mail 16 + DEX 0 = 16, heavy armour" });
  });

  it("subtracts none of a negative dexterity modifier from heavy armour", () => {
    expect(armourClassOf({ baseScores: withDexterity(6), items: [itemOf("Chain Mail", new HeavyArmour(), 16)] }).value).toBe(16);
  });

  it("counts a magic item that needs attunement only when it is attuned", () => {
    const needs = { ...itemOf("Pale Mail", new HeavyArmour(), 18), needsAttunement: true };
    expect([armourClassOf({ items: [needs] }).value, armourClassOf({ items: [{ ...needs, attuned: true }] }).value]).toEqual([10, 18]);
  });
});
