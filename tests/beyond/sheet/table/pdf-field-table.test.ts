import { describe, expect, it } from "vitest";
import { printedFieldNames } from "../../../../src/beyond/sheet/table/pdf-field-table";
import { MadeUpSheet } from "../../builders/made-up-sheet";

const AWKWARD_NAMES = ["CLASS  LEVEL", "DEXmod ", "Stealth ", "CHamod", "SleightofHand", "Animal", "ST Strength", "Eq Name25", "SpellName49", "spellName4"];

describe("the table of printed field names", () => {
  it("lists exactly the fields the made-up sheet fills, no more and no fewer", () => {
    expect([...printedFieldNames()].sort()).toEqual(MadeUpSheet.monk().names().sort());
  });

  it("lists each name once", () => {
    const names = printedFieldNames();
    expect(new Set(names).size).toBe(names.length);
  });

  it("holds a hundred and fifty-eight names", () => {
    expect(printedFieldNames()).toHaveLength(158);
  });

  it.each(AWKWARD_NAMES)("holds %j exactly as the form writes it, with its stray spaces", (name) => {
    expect(printedFieldNames()).toContain(name);
  });

  it.each(["DEXmod", "Stealth", "CLASS LEVEL", "CHAmod", "Sleight of Hand", "SpellName0", "spellName5"])("does not hold the near miss %j", (name) => {
    expect(printedFieldNames()).not.toContain(name);
  });
});
