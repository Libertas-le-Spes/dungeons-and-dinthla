import { describe, expect, it } from "vitest";
import { readPdfFieldsWith } from "../../../src/pdf/read-pdf-fields";
import { readPrintedSheet } from "../../../src/beyond/sheet/read-printed-sheet";
import type { ImportedCharacter } from "../../../src/beyond/shape/imported-character";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { NeutralText } from "../../../src/beyond/text/neutral-text";
import { FormDocument } from "../../pdf/writer/documents/form-document";
import { literal } from "../../pdf/writer/pdf-text";
import { testParts } from "../../pdf/writer/zlib-chunks";
import { MadeUpSheet } from "../builders/made-up-sheet";
import { SHEET_NUMBERS } from "../builders/sheet-numbers";

const IDENTITY = ["CharacterName", "RACE", "CLASS  LEVEL"];
const HOSTILE = "<b>Hostile</b>\u0007‮ [[Link]] <script>x</script>\r\nSecond line";

function readOf(sheet: MadeUpSheet): ImportedCharacter {
  return readPrintedSheet(sheet.fields());
}

function withEveryFieldBut(kept: readonly string[], value: string | boolean | string[]): MadeUpSheet {
  const sheet = MadeUpSheet.monk();
  for (const name of sheet.names()) {
    if (!kept.includes(name)) sheet.with(name, value);
  }
  return sheet;
}

function unknownNames(character: ImportedCharacter): string[] {
  return character.numbers.filter(isNotKnown).map(nameOf);
}

function isNotKnown(number: { value: { isKnown: boolean } }): boolean {
  return !number.value.isKnown;
}

function nameOf(number: { name: string }): string {
  return number.name;
}

function allTexts(character: ImportedCharacter): string[] {
  const texts = [character.name.text, character.species.text];
  for (const found of character.classes) texts.push(found.name.text, found.level.explanation);
  for (const number of character.numbers) texts.push(number.value.explanation);
  for (const item of character.inventory) texts.push(item.name.text, item.count.explanation);
  for (const line of [...character.spells, ...character.features]) texts.push(line.text);
  return texts;
}

describe("reading a whole made-up sheet", () => {
  it("makes a character whose every number is known, on the PDF route", () => {
    const character = readOf(MadeUpSheet.monk());
    expect([unknownNames(character), character.route.name, character.numbers.length]).toEqual([[], "pdf", SHEET_NUMBERS.length]);
  });

  it("keeps each number the sheet prints, as printed", () => {
    const character = readOf(MadeUpSheet.monk());
    expect(character.numbers.map(valueOfNumber)).toEqual(SHEET_NUMBERS.map(valueOfRow));
  });

  it("reads a sheet of all seven hundred and seventy-five fields, made into a PDF and back", async () => {
    const sheet = MadeUpSheet.monk();
    const form = new FormDocument();
    for (const name of sheet.names()) form.text(name, literal(String(sheet.fields().get(name)).replaceAll("\n", "\\n")));
    for (let other = sheet.names().length; other < 775; other += 1) form.text(`Other Field ${other}`, literal("Secondary Filler"));
    const result = await readPdfFieldsWith(form.classic(), testParts());
    if (!result.ok) throw new Error(result.reason);
    expect(result.fields.size).toBe(775);
    expect(JSON.stringify(readPrintedSheet(result.fields))).toBe(JSON.stringify(readOf(sheet)));
  });
});

function valueOfNumber(number: { value: { valueOr(whenNotKnown: number): number } }): number {
  return number.value.valueOr(Number.NaN);
}

function valueOfRow(row: { value: number }): number {
  return row.value;
}

describe("reading a sheet with fields gone or empty", () => {
  it("is refused when there are no fields at all, as the sheet has no name", () => {
    expect(() => readPrintedSheet(new Map())).toThrow(Refusal);
  });

  it("has every number not known, and every list empty, when only who the character is is there", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, "").without("PP"));
    expect([unknownNames(character).length, character.inventory, character.spells, character.features]).toEqual([SHEET_NUMBERS.length, [], [], []]);
  });

  it("has every number and coin not known when each field is only spaces", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, "   "));
    expect([unknownNames(character).length, character.scores.strength.isKnown, character.purse.copper.isKnown, character.inventory.map(countKnown)]).toEqual([SHEET_NUMBERS.length, false, false, []]);
  });

  it("has every number, score and coin not known when each field holds a check box or a choice instead of text", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, true));
    expect([unknownNames(character).length, character.scores.charisma.isKnown, character.purse.gold.isKnown, character.spells]).toEqual([SHEET_NUMBERS.length, false, false, []]);
    expect(unknownNames(readOf(withEveryFieldBut(IDENTITY, ["Primary"]))).length).toBe(SHEET_NUMBERS.length);
  });

  it("has no number turned into zero or false when a field is absent, a check box is absent or it is blank", () => {
    const character = readOf(MadeUpSheet.monk().without("AC").with("MaxHP", ""));
    expect([character.numbers.find(isNamed("AC"))?.value.valueOr(-1), character.numbers.find(isNamed("HP"))?.value.valueOr(-1)]).toEqual([-1, -1]);
  });
});

function countKnown(item: { count: { isKnown: boolean } }): boolean {
  return item.count.isKnown;
}

function isNamed(name: string): (number: { name: string }) => boolean {
  return function named(number: { name: string }): boolean {
    return number.name === name;
  };
}

describe("reading a sheet with hostile text and numbers", () => {
  it("has hostile text in every field but the name come out as plain one-line text", () => {
    const character = readOf(withEveryFieldBut(["CharacterName", "RACE", "CLASS  LEVEL"], HOSTILE));
    for (const text of allTexts(character)) {
      expect(text).not.toMatch(/[<>\u0000-\u0009\u000b-\u001f\u007f‮\n\r]/u);
    }
  });

  it("has hostile text in a feature, a spell and an item written to a note as neutral text", () => {
    const sheet = MadeUpSheet.empty().with("CharacterName", "Primary Monk").with("RACE", "Human").with("CLASS  LEVEL", "Monk 1");
    sheet.with("FeaturesTraits1", "[[Primary]] ![[Image]] %% #tag ==mark== a::b").with("spellName0", "# Heading").with("Eq Name0", "- [ ] task");
    const character = readOf(sheet);
    const written = [...character.features, ...character.spells, ...character.inventory.map(nameOfItem)].map(neutral);
    expect(written.join("\n")).not.toMatch(/\[\[|%%|==|::|^#|^- /mu);
  });

  it.each(SHEET_NUMBERS)("has only $name not known when $field holds a number out of range", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "99999")))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known when $field holds 1e999", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "1e999")))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known when $field holds words", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "twelve")))).toEqual([name]);
  });

  it("has a negative zero not known wherever a sign is allowed", () => {
    const character = readOf(MadeUpSheet.monk().with("Init", "-0").with("STRmod", "-0").with("ST Wisdom", "-0"));
    expect(unknownNames(character)).toEqual(["Initiative", "STR modifier", "WIS save"]);
  });

  it("has a plus sign refused where the sheet prints a plain number", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "+18").with("PP", "+1")))).toEqual(["AC"]);
  });

  it("has a very long digit string not known, not infinity", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "9".repeat(8000))))).toEqual(["AC"]);
  });

  it("has a very long text in a number field not known", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "x".repeat(8000))))).toEqual(["AC"]);
  });
});

function nameOfItem(item: { name: { text: string } }): { text: string } {
  return item.name;
}

function neutral(line: { text: string }): string {
  return NeutralText.ofLines(line.text).written;
}

describe("reading a sheet with fields that mean nothing here", () => {
  it("ignores fields it does not map, whatever they hold", () => {
    const extra = MadeUpSheet.monk().with("Backstory", "Secondary Story").with("Unknown Field", "Secondary Text").with("Inspiration", true).with("Check Box 12", false).with("CharacterName2", "Secondary Name");
    expect(JSON.stringify(readOf(extra))).toBe(JSON.stringify(readOf(MadeUpSheet.monk())));
  });

  it("does not carry the text of an unmapped field into the character", () => {
    const character = readOf(MadeUpSheet.monk().with("Backstory", "Secondary Story").with("PersonalityTraits ", "Secondary Trait"));
    expect(JSON.stringify(character)).not.toContain("Secondary");
  });

  it("does not take a check box that is absent for a box that is empty", () => {
    expect(JSON.stringify(readOf(MadeUpSheet.monk().without("Inspiration")))).toBe(JSON.stringify(readOf(MadeUpSheet.monk().with("Inspiration", false))));
  });

  it("tells DEXmod from DEXmod with its space, and reads only the one the form uses", () => {
    const wrongOnly = MadeUpSheet.monk().without("DEXmod ").with("DEXmod", "+7");
    const both = MadeUpSheet.monk().with("DEXmod", "+7");
    expect(unknownNames(readOf(wrongOnly))).toEqual(["DEX modifier"]);
    expect(readOf(both).numbers.find(isNamed("DEX modifier"))?.value.valueOr(0)).toBe(-2);
  });

  it("tells Stealth from Stealth with its space, and CLASS LEVEL from CLASS  LEVEL", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().without("Stealth ").with("Stealth", "+7")))).toEqual(["Stealth"]);
    expect(() => readOf(MadeUpSheet.monk().without("CLASS  LEVEL").with("CLASS LEVEL", "Monk 4"))).toThrow(Refusal);
  });
});
