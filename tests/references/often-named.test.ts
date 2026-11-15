import { describe, expect, it } from "vitest";
import { LINES_FOR_A_NOTE } from "../../src/kinds/lines-for-a-note";
import { oftenNamed } from "../../src/references/often-named";

describe("oftenNamed", () => {
  it("asks for three lines", () => {
    expect(LINES_FOR_A_NOTE).toBe(3);
  });

  it("leaves out a name on two lines", () => {
    expect(
      oftenNamed([
        { name: "Mira", lineCount: 2, kind: "character" },
        { name: "Old Mill", lineCount: 2, kind: null },
      ]),
    ).toEqual({ known: [], undecided: [] });
  });

  it("keeps a name on three lines, known when a line says what it is", () => {
    expect(
      oftenNamed([
        { name: "Mira", lineCount: 3, kind: "character" },
        { name: "Old Mill", lineCount: 4, kind: "place" },
      ]),
    ).toEqual({
      known: [
        { name: "Mira", lineCount: 3, kind: "character" },
        { name: "Old Mill", lineCount: 4, kind: "place" },
      ],
      undecided: [],
    });
  });

  it("puts a name on three lines that no line places or gives a role among the undecided", () => {
    expect(oftenNamed([{ name: "Baka", lineCount: 3, kind: null }])).toEqual({
      known: [],
      undecided: [{ name: "Baka", lineCount: 3, kind: null }],
    });
  });
});
