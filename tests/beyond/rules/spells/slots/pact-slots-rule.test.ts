import { describe, expect, it } from "vitest";
import { classOf, madeUpRuleCharacter, namesWorkedOut, numberNamed } from "../../../builders/made-up-rule-character";

function pactOf(level: number) {
  const character = madeUpRuleCharacter({ classes: [classOf("Warlock", level, 8)] });
  return [numberNamed(character, "Pact slots").valueOr(-1), numberNamed(character, "Pact slot level").valueOr(-1)];
}

describe("PactSlotsRule", () => {
  it.each([
    { level: 1, count: 1, slotLevel: 1 },
    { level: 2, count: 2, slotLevel: 1 },
    { level: 5, count: 2, slotLevel: 3 },
    { level: 9, count: 2, slotLevel: 5 },
    { level: 11, count: 3, slotLevel: 5 },
    { level: 16, count: 3, slotLevel: 5 },
    { level: 17, count: 4, slotLevel: 5 },
    { level: 20, count: 4, slotLevel: 5 },
  ])("gives $count slots of level $slotLevel at warlock level $level", ({ level, count, slotLevel }) => {
    expect(pactOf(level)).toEqual([count, slotLevel]);
  });

  it("shows the working", () => {
    const character = madeUpRuleCharacter({ classes: [classOf("Warlock", 5, 8)] });
    expect(numberNamed(character, "Pact slots").explanation).toBe("Warlock 5: 2 slots of level 3");
  });

  it("gives a warlock no ordinary slots", () => {
    const names = namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Warlock", 5, 8)] }));
    expect(names.filter((name) => name.startsWith("Spell slots"))).toEqual([]);
  });

  it("names no pact slots for another class", () => {
    expect(namesWorkedOut(madeUpRuleCharacter({ classes: [classOf("Wizard", 5, 6)] })).filter((name) => name.startsWith("Pact"))).toEqual([]);
  });

  it("does not know the pact slots when the total level is not known", () => {
    expect(numberNamed(madeUpRuleCharacter({ classes: [classOf("Warlock", 21, 8)] }), "Pact slots").isKnown).toBe(false);
  });
});
