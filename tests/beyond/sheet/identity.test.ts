import { describe, expect, it } from "vitest";
import { readPrintedSheet } from "../../../src/beyond/sheet/read-printed-sheet";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { MadeUpSheet } from "../builders/made-up-sheet";

function readOf(sheet: MadeUpSheet) {
  return readPrintedSheet(sheet.fields());
}

describe("who the sheet says the character is", () => {
  it("is the printed name, species and classes, on the PDF route", () => {
    const character = readOf(MadeUpSheet.monk());
    expect([character.route.name, character.name.text, character.species.text, character.classes.map(classText)]).toEqual(["pdf", "Primary Monk", "Human", ["Monk"]]);
  });

  it("is read from the first name field only, not the copies on the other pages", () => {
    const sheet = MadeUpSheet.monk().with("CharacterName2", "Secondary Name").with("CharacterName4", "Third Name").with("RACE2", "Secondary Species");
    expect([readOf(sheet).name.text, readOf(sheet).species.text]).toEqual(["Primary Monk", "Human"]);
  });

  it.each(["CharacterName", "RACE", "CLASS  LEVEL"])("is refused when %j is missing", (field) => {
    expect(() => readOf(MadeUpSheet.monk().without(field))).toThrow(Refusal);
  });

  it.each(["", "  ", "<b></b>", "two\nlines", "x".repeat(101), true, ["Primary"]])("is refused for a name of %j", (name) => {
    expect(() => readOf(MadeUpSheet.monk().with("CharacterName", name))).toThrow(Refusal);
  });

  it("is refused with its own words for a missing name, species and class", () => {
    const refusal = (field: string): string => {
      try {
        readOf(MadeUpSheet.monk().without(field));
      } catch (error) {
        return String(error);
      }
      return "";
    };
    expect([refusal("CharacterName"), refusal("RACE"), refusal("CLASS  LEVEL")]).toEqual([
      "Error: The sheet's character name is missing, blank or not text.",
      "Error: The sheet's species is missing, blank or not text.",
      "Error: The sheet names no class for this character.",
    ]);
  });

  it("keeps the name at its longest and refuses one more", () => {
    expect(readOf(MadeUpSheet.monk().with("CharacterName", "x".repeat(100))).name.text).toHaveLength(100);
    expect(() => readOf(MadeUpSheet.monk().with("CharacterName", "x".repeat(101)))).toThrow(Refusal);
  });

  it("has markup and control characters taken out of the name and the species", () => {
    const sheet = MadeUpSheet.monk().with("CharacterName", "<b>Primary</b>\u0007 Monk​").with("RACE", "<i>Hu</i>man");
    expect([readOf(sheet).name.text, readOf(sheet).species.text]).toEqual(["Primary Monk", "Human"]);
  });
});

function classText(found: { name: { text: string } }): string {
  return found.name.text;
}
