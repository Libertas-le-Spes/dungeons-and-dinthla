import { describe, expect, it } from "vitest";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { printedOf } from "../../builders/sheet-reading";

function whoSheet(): MadeUpSheet {
  return MadeUpSheet.empty().with("CharacterName", "Primary Monk").with("RACE", "Human").with("CLASS  LEVEL", "Monk 1");
}

describe("what the reading says it left out", () => {
  it.each([101, 301])("counts an item name of %i characters as left out, as too long", (length) => {
    expect(printedOf(whoSheet().with("Eq Name0", "x".repeat(length))).leftOut.items).toEqual({ tooLong: 1, notClean: 0 });
  });

  it.each([101, 301])("counts a spell name of %i characters as left out, as too long", (length) => {
    expect(printedOf(whoSheet().with("spellName0", "x".repeat(length))).leftOut.spells).toEqual({ tooLong: 1, notClean: 0 });
  });

  it.each([101, 301])("counts a feature line of %i characters as left out, as too long", (length) => {
    expect(printedOf(whoSheet().with("FeaturesTraits1", "x".repeat(length))).leftOut.features).toEqual({ tooLong: 1, notClean: 0 });
  });

  it("counts a line that is only markup as left out, as not clean, in each list", () => {
    const printed = printedOf(whoSheet().with("Eq Name0", "<br>").with("spellName0", "<br>").with("FeaturesTraits1", "<br>"));
    expect([printed.leftOut.items, printed.leftOut.spells, printed.leftOut.features]).toEqual([{ tooLong: 0, notClean: 1 }, { tooLong: 0, notClean: 1 }, { tooLong: 0, notClean: 1 }]);
  });

  it("counts each list on its own", () => {
    const printed = printedOf(whoSheet().with("FeaturesTraits1", "x".repeat(101)));
    expect([printed.leftOut.items, printed.leftOut.spells]).toEqual([{ tooLong: 0, notClean: 0 }, { tooLong: 0, notClean: 0 }]);
  });

  it("counts a blank line as nothing left out", () => {
    expect(printedOf(whoSheet().with("FeaturesTraits1", "\n\n   \n")).leftOut.features).toEqual({ tooLong: 0, notClean: 0 });
  });

  it("keeps the usable lines beside the ones left out", () => {
    const printed = printedOf(whoSheet().with("FeaturesTraits1", `One\n${"x".repeat(150)}\nTwo`));
    expect([printed.character.features.length, printed.leftOut.features.tooLong]).toEqual([2, 1]);
  });
});
