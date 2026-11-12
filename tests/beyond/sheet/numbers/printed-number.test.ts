import { describe, expect, it } from "vitest";
import { SCORE } from "../../../../src/beyond/shape/import-limits";
import { SIGNED, WHOLE } from "../../../../src/beyond/sheet/numbers/number-texts";
import { PrintedNumber } from "../../../../src/beyond/sheet/numbers/printed-number";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

const FIELD = "Primary Field";
const SCORE_FIELD = new PrintedNumber(FIELD, SCORE, WHOLE);

function readWith(printed: string | boolean | string[]) {
  return SCORE_FIELD.read(new SheetFields(MadeUpSheet.empty().with(FIELD, printed).fields()));
}

describe("a number printed on the sheet", () => {
  it("is known as printed, on the PDF route, with no working", () => {
    const value = readWith("12");
    expect([value.isKnown, value.valueOr(0), value.route.name, value.explanation]).toEqual([true, 12, "pdf", ""]);
  });

  it("is read from its text with the spaces around it taken off", () => {
    expect(readWith("  12 ").valueOr(0)).toBe(12);
  });

  it("is not known when the field is missing, and says which field", () => {
    const value = SCORE_FIELD.read(new SheetFields(new Map()));
    expect([value.isKnown, value.explanation]).toEqual([false, `The sheet's field "${FIELD}" is missing or is not text.`]);
  });

  it.each([true, false, ["12"]])("is not known when the field holds %j instead of text", (held) => {
    expect(readWith(held).explanation).toBe(`The sheet's field "${FIELD}" is missing or is not text.`);
  });

  it.each(["", "   "])("is not known when the field is blank (%j)", (blank) => {
    expect(readWith(blank).explanation).toBe(`The sheet's field "${FIELD}" is blank.`);
  });

  it("is not known when the text is not in the form the sheet prints", () => {
    expect(readWith("twelve").explanation).toBe(`The sheet's field "${FIELD}" does not hold a number in the form the sheet prints.`);
  });

  it.each(["0", "31", "99999999999999999999999999"])("is not known when %j is outside the range", (printed) => {
    expect(readWith(printed).isKnown).toBe(false);
  });

  it.each(["1", "30"])("is known at the edge %j of the range", (printed) => {
    expect(readWith(printed).isKnown).toBe(true);
  });

  it("is not known for a negative zero", () => {
    const signed = new PrintedNumber(FIELD, { what: "A bonus", lowest: -5, highest: 5 }, SIGNED);
    expect(signed.read(new SheetFields(MadeUpSheet.empty().with(FIELD, "-0").fields())).isKnown).toBe(false);
  });
});
