import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/beyond/sheet/read-printed-sheet", brokenReader);

function broken(): never {
  throw new TypeError("A made-up failure.");
}

function brokenReader(): { readPrintedSheet: () => never } {
  return { readPrintedSheet: vi.fn(broken) };
}

const { SHEET_NOT_READ, sheetFromPdf } = await import("../../../../src/beyond/sheet/from-pdf/sheet-from-pdf");
const { MadeUpSheet } = await import("../../builders/made-up-sheet");
const { madeUpPdf } = await import("../../../imports/builders/made-up-pdf");

describe("reading a sheet that fails in a way no refusal names", () => {
  it("refuses with plain words of its own, not the failure's", async () => {
    expect(await sheetFromPdf(madeUpPdf(MadeUpSheet.monk()))).toEqual({ ok: false, reason: SHEET_NOT_READ });
    expect(SHEET_NOT_READ).toBe("Something went wrong while reading the sheet in this file, so nothing was read.");
  });
});
