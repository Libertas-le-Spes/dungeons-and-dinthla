import { describe, expect, it } from "vitest";
import { printedTexts, usableLines } from "../../../../src/beyond/sheet/lines/printed-lines";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

function textsOf(lines: readonly { text: string }[]): string[] {
  return lines.map(textOfLine);
}

function textOfLine(line: { text: string }): string {
  return line.text;
}

describe("the usable lines of some texts", () => {
  it("are one per non-blank line, in order, across the texts", () => {
    expect(textsOf(usableLines(["One\n\nTwo", "Three"]))).toEqual(["One", "Two", "Three"]);
  });

  it("split on every kind of line break", () => {
    expect(textsOf(usableLines(["One\r\nTwo\rThree Four"]))).toEqual(["One", "Two", "Three", "Four"]);
  });

  it("leave out a line that is too long and keep its neighbours", () => {
    expect(textsOf(usableLines([`One\n${"x".repeat(101)}\nTwo`]))).toEqual(["One", "Two"]);
  });

  it("take markup and control characters out of each line", () => {
    expect(textsOf(usableLines(["A <b>bold</b> line\u0007\n<script>alert(1)</script>Next"]))).toEqual(["A bold line", "alert(1)Next"]);
  });

  it("are none when the texts are none", () => {
    expect(usableLines([])).toEqual([]);
  });
});

describe("the printed texts of some fields", () => {
  const fields = new SheetFields(MadeUpSheet.empty().with("One", "a").with("Two", true).with("Four", "d").fields());

  it("are those of the fields that hold text, in the order asked for", () => {
    expect(printedTexts(fields, ["Four", "Two", "Three", "One"])).toEqual(["d", "a"]);
  });
});
