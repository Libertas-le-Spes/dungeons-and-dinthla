import { describe, expect, it } from "vitest";
import type { NamedOnLines } from "../../src/references/named-on-lines";
import { LINES_FOR_A_NOTE, oftenNamed } from "../../src/references/often-named";

function named(name: string, lineCount: number, kind: NamedOnLines["kind"]): NamedOnLines {
  return { name, lineCount, kind };
}

describe("oftenNamed", () => {
  it("asks for three lines", () => {
    expect(LINES_FOR_A_NOTE).toBe(3);
  });

  it("leaves out a name on two lines", () => {
    expect(oftenNamed([named("Mira", 2, "character"), named("Old Mill", 2, null)])).toEqual({ known: [], undecided: [] });
  });

  it("keeps a name on three lines, known when a line says what it is", () => {
    expect(oftenNamed([named("Mira", 3, "character"), named("Old Mill", 4, "place")])).toEqual({ known: [named("Mira", 3, "character"), named("Old Mill", 4, "place")], undecided: [] });
  });

  it("puts a name on three lines that no line places or gives a role among the undecided", () => {
    expect(oftenNamed([named("Baka", 3, null)])).toEqual({ known: [], undecided: [named("Baka", 3, null)] });
  });
});
