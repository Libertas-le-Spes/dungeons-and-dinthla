import { describe, expect, it } from "vitest";
import { PrintedLine } from "../../../../src/beyond/sheet/lines/printed-line";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

const REASON = "Primary reason.";
const LINE = new PrintedLine("Primary Line", whenMissing);

function whenMissing(): Refusal {
  return new Refusal(REASON);
}

function readWith(held: string | boolean | string[]): string {
  return LINE.read(new SheetFields(MadeUpSheet.empty().with("Primary Line", held).fields())).text;
}

describe("a line the sheet must have", () => {
  it("is the clean text of its field", () => {
    expect(readWith(" Primary <b>Monk</b> ")).toBe("Primary Monk");
  });

  it("is refused, with the reason it was given, when the field is missing", () => {
    expect(() => LINE.read(new SheetFields(new Map()))).toThrow(REASON);
  });

  it.each(["", "   ", true, ["Monk"]])("is refused, with the same reason, for %j", (held) => {
    expect(() => readWith(held)).toThrow(REASON);
  });

  it.each(["\u2800", "\u0301", "-- ** --", "<b>-</b>"])("is refused for %j, which holds no letter or digit", (held) => {
    expect(() => readWith(held)).toThrow(REASON);
  });

  it("is kept when it holds one digit", () => {
    expect(readWith("7")).toBe("7");
  });

  it.each(["two\nlines", "x".repeat(101), "<b></b>"])("is refused for %j, which is no clean line", (held) => {
    expect(() => readWith(held)).toThrow(Refusal);
  });
});
