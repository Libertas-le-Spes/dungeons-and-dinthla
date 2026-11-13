import { describe, expect, it } from "vitest";
import { MOST_PDF_BYTES, sheetFromPdf } from "../../../../src/beyond/sheet/from-pdf/sheet-from-pdf";
import { MAX_FILE_BYTES } from "../../../../src/pdf/limits/pdf-limits";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { madeUpPdf, notAPdf } from "../../../imports/builders/made-up-pdf";

describe("reading D&D Beyond's sheet from a PDF's bytes", () => {
  it("gives the printed sheet of a made-up PDF", async () => {
    const read = await sheetFromPdf(madeUpPdf(MadeUpSheet.monk()));
    if (!read.ok) throw new Error(`The made-up PDF was refused: ${read.reason}`);
    expect(read.sheet.character.name.text).toBe("Primary Monk");
    expect(read.sheet.character.route.name).toBe("pdf");
  });

  it("gives the PDF reader's refusal for bytes that aren't a PDF", async () => {
    expect(await sheetFromPdf(notAPdf())).toEqual({ ok: false, reason: "This is not a PDF file, so it was not read." });
  });

  it("gives the sheet's refusal for a PDF the sheet can't be read from", async () => {
    expect(await sheetFromPdf(madeUpPdf(MadeUpSheet.monk().without("CharacterName")))).toEqual({ ok: false, reason: "The sheet's character name is missing, blank or not text." });
  });

  it("has the PDF reader's own size limit", () => {
    expect(MOST_PDF_BYTES).toBe(MAX_FILE_BYTES);
  });
});
