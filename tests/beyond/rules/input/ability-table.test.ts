import { describe, expect, it } from "vitest";
import type { Ability } from "../../../../src/beyond/rules/input/ability";
import { ABILITIES, CHARISMA, DEXTERITY, STRENGTH } from "../../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../../src/beyond/rules/input/by-ability";

function namesOf(ability: Ability): string[] {
  return [ability.short, ability.subTypeName];
}

describe("AbilityTable", () => {
  it("holds a value for each ability it was given", () => {
    const table = new AbilityTable<number>().with(STRENGTH, 12).with(DEXTERITY, 14);
    expect([table.get(STRENGTH), table.get(DEXTERITY), table.get(CHARISMA)]).toEqual([12, 14, undefined]);
  });

  it("names the six abilities with their short names and lower-case sub-type names", () => {
    expect(ABILITIES.map(namesOf)).toEqual([
      ["STR", "strength"],
      ["DEX", "dexterity"],
      ["CON", "constitution"],
      ["INT", "intelligence"],
      ["WIS", "wisdom"],
      ["CHA", "charisma"],
    ]);
  });
});
