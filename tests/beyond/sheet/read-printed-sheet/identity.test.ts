import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { readOf } from "../../builders/sheet-reading";

function reasonOfMissing(field: string): string {
  try {
    readOf(MadeUpSheet.monk().without(field));
  } catch (error) {
    return String(error);
  }
  return "";
}

function classNames(sheet: MadeUpSheet): string[] {
  return readOf(sheet).classes.map(textOfClass);
}

function textOfClass(found: { name: { text: string } }): string {
  return found.name.text;
}

describe("who the sheet says the character is", () => {
  it("is the printed name, species and classes, on the PDF route", () => {
    const character = readOf(MadeUpSheet.monk());
    expect([character.route.name, character.name.text, character.species.text, character.classes.length]).toEqual(["pdf", "Primary Monk", "Human", 1]);
  });

  it("is read from the first name field only, not the copies on the other pages", () => {
    const sheet = MadeUpSheet.monk().with("CharacterName2", "Secondary Name").with("CharacterName4", "Third Name").with("RACE2", "Secondary Species");
    const character = readOf(sheet);
    expect([character.name.text, character.species.text]).toEqual(["Primary Monk", "Human"]);
  });

  it("is the printed size and alignment, and no creature type, which the form has no field for", () => {
    const character = readOf(MadeUpSheet.monk().with("SIZE", "Small").with("ALIGNMENT", "Lawful Neutral"));
    expect([character.size?.text, character.alignment?.text, character.creatureType]).toEqual(["Small", "Lawful Neutral", null]);
  });

  it.each(["SIZE", "ALIGNMENT"])("has nothing for %j when it is missing, blank, of the wrong kind or unreadable", (field) => {
    for (const printed of [undefined, "", "  ", true, "<b></b>", "two\nlines"]) {
      const sheet = MadeUpSheet.monk();
      if (printed === undefined) sheet.without(field);
      else sheet.with(field, printed);
      const character = readOf(sheet);
      expect([character.size, character.alignment].filter((line) => line === null)).toHaveLength(1);
    }
  });

  it.each(["CharacterName", "RACE", "CLASS  LEVEL"])("is refused when %j is missing", (field) => {
    expect(() => readOf(MadeUpSheet.monk().without(field))).toThrow(Refusal);
  });

  it.each(["", "  ", "<b></b>", "two\nlines", "x".repeat(101), true, ["Primary"], "⠀", "́", "-- --", "​​"])("is refused for a name of %j", (name) => {
    expect(() => readOf(MadeUpSheet.monk().with("CharacterName", name))).toThrow(Refusal);
  });

  it.each(["", "⠀", "́", "<br>", "***"])("is refused for a species of %j", (species) => {
    expect(() => readOf(MadeUpSheet.monk().with("RACE", species))).toThrow(Refusal);
  });

  it.each(["⠀", "́ 3", "⠀ / ⠀", "<br>"])("is refused for a class of %j", (printed) => {
    expect(() => readOf(MadeUpSheet.monk().with("CLASS  LEVEL", printed))).toThrow("The sheet names no class for this character.");
  });

  it("is refused with its own words for a missing name, species and class", () => {
    expect([reasonOfMissing("CharacterName"), reasonOfMissing("RACE"), reasonOfMissing("CLASS  LEVEL")]).toEqual([
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
    const character = readOf(MadeUpSheet.monk().with("CharacterName", "<b>Primary</b>\u0007 Monk​").with("RACE", "<i>Hu</i>man"));
    expect([character.name.text, character.species.text]).toEqual(["Primary Monk", "Human"]);
  });

  it("is a name of one digit", () => {
    expect(readOf(MadeUpSheet.monk().with("CharacterName", "7")).name.text).toBe("7");
  });

  it("has markup cleaned out of the classes before they are split at a slash", () => {
    expect(classNames(MadeUpSheet.monk().with("CLASS  LEVEL", "<b>bold</b> 3"))).toEqual(["bold"]);
  });

  it("imports a sheet that is no D&D Beyond export but has the three names, with every number not known", () => {
    const stranger = MadeUpSheet.empty().with("CharacterName", "Primary Name").with("RACE", "Plain").with("CLASS  LEVEL", "Plain 1");
    const character = readOf(stranger);
    expect([character.numbers.every(isUnknown), character.inventory, character.spells, character.features]).toEqual([true, [], [], []]);
  });
});

function isUnknown(number: { value: { isKnown: boolean } }): boolean {
  return !number.value.isKnown;
}
