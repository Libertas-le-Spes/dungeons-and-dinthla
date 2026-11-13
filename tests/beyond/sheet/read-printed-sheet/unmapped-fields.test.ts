import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { printedOf, readOf, unknownNames } from "../../builders/sheet-reading";

describe("reading a sheet with fields that mean nothing here", () => {
  it("ignores fields it does not map, whatever they hold, and carries none of their text", () => {
    const extra = MadeUpSheet.monk().with("Backstory", "Secondary Story").with("Unknown Field", "Secondary Text").with("Inspiration", true).with("Check Box 12", false).with("CharacterName2", "Secondary Name").with("PersonalityTraits ", "Secondary Trait");
    const printed = printedOf(extra);
    expect(JSON.stringify(printed)).toBe(JSON.stringify(printedOf(MadeUpSheet.monk())));
    expect(JSON.stringify(printed)).not.toContain("Secondary");
  });

  it("does not take a check box that is absent for a box that is empty", () => {
    expect(JSON.stringify(printedOf(MadeUpSheet.monk().without("Inspiration")))).toBe(JSON.stringify(printedOf(MadeUpSheet.monk().with("Inspiration", false))));
  });

  it("tells DEXmod from DEXmod with its space, and reads only the one the form uses", () => {
    const wrongOnly = MadeUpSheet.monk().without("DEXmod ").with("DEXmod", "+7");
    expect(unknownNames(readOf(wrongOnly))).toEqual(["DEX modifier"]);
    expect(unknownNames(readOf(MadeUpSheet.monk().with("DEXmod", "+7")))).toEqual([]);
  });

  it("tells Stealth from Stealth with its space, and CLASS LEVEL from CLASS  LEVEL", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().without("Stealth ").with("Stealth", "+7")))).toEqual(["Stealth"]);
    expect(() => readOf(MadeUpSheet.monk().without("CLASS  LEVEL").with("CLASS LEVEL", "Monk 4"))).toThrow(Refusal);
  });
});
