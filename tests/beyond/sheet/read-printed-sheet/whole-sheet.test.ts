import { describe, expect, it } from "vitest";
import { readPdfFieldsWith } from "../../../../src/pdf/read-pdf-fields";
import { readPrintedSheet } from "../../../../src/beyond/sheet/read-printed-sheet";
import { FormDocument } from "../../../pdf/writer/documents/form-document";
import { literal } from "../../../pdf/writer/pdf-text";
import { testParts } from "../../../pdf/writer/zlib-chunks";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { printedOf, readOf, unknownNames, valueNamed } from "../../builders/sheet-reading";
import { SHEET_NUMBERS } from "../../builders/sheet-numbers";

const NOTHING_LEFT_OUT = { tooLong: 0, notClean: 0 };

describe("reading a whole made-up sheet", () => {
  it("makes a character whose every number is known, on the PDF route", () => {
    const character = readOf(MadeUpSheet.monk());
    expect([unknownNames(character), character.route.name, character.numbers.length]).toEqual([[], "pdf", SHEET_NUMBERS.length]);
  });

  it.each(SHEET_NUMBERS)("keeps $name as printed", ({ name, value }) => {
    expect(valueNamed(readOf(MadeUpSheet.monk()), name)).toBe(value);
  });

  it("says nothing was left out of a sheet whose lines are all usable", () => {
    expect(printedOf(MadeUpSheet.monk()).leftOut).toEqual({ items: NOTHING_LEFT_OUT, spells: NOTHING_LEFT_OUT, features: NOTHING_LEFT_OUT });
  });

  it("reads a sheet of all seven hundred and seventy-five fields, made into a PDF and back", async () => {
    const sheet = MadeUpSheet.monk();
    const form = new FormDocument();
    for (const name of sheet.names()) form.text(name, literal(String(sheet.fields().get(name)).replaceAll("\n", "\\n")));
    for (let other = sheet.names().length; other < 775; other += 1) form.text(`Other Field ${other}`, literal("Secondary Filler"));
    const result = await readPdfFieldsWith(form.classic(), testParts());
    if (!result.ok) throw new Error(result.reason);
    expect(result.fields.size).toBe(775);
    expect(JSON.stringify(readPrintedSheet(result.fields))).toBe(JSON.stringify(printedOf(sheet)));
  });

  it("reads a long feature box made into a PDF and back, and counts what it leaves out", async () => {
    const form = new FormDocument().text("CharacterName", literal("Primary Monk")).text("RACE", literal("Human")).text("CLASS  LEVEL", literal("Monk 1"));
    form.text("FeaturesTraits1", literal(`Short\\n${"x".repeat(150)}\\nShort too`));
    const result = await readPdfFieldsWith(form.classic(), testParts());
    if (!result.ok) throw new Error(result.reason);
    const printed = readPrintedSheet(result.fields);
    expect([printed.character.features.length, printed.leftOut.features]).toEqual([2, { tooLong: 1, notClean: 0 }]);
  });
});
