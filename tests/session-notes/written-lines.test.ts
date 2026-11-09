import { describe, expect, it } from "vitest";
import { writtenLinesOf } from "../../src/session-notes/written-lines";

const PATH = "Pale Moon/Sessions/Session 12.md";

function linesOf(text: string, firstLine: number) {
  return writtenLinesOf({ path: PATH, number: 12, text, firstLine }).map((line) => [line.source.line, line.glyph, line.marker, line.text]);
}

describe("writtenLinesOf", () => {
  it("reads the lines below the properties in order, each with its mark cut from its text", () => {
    const text = ["---", "played: 2026-11-09", "---", "", "Tracks lead to the [[Old Mill]].", "- ? Who sent the letter", "! Find the caravan, from: [[Lady Vess]]", "$ 20 gp from Lady Vess\r", "?= Who sent the letter: Mira"].join("\n");
    expect(linesOf(text, 3)).toEqual([
      [4, "", null, "Tracks lead to the [[Old Mill]]."],
      [5, "?", "question", "Who sent the letter"],
      [6, "!", "quest", "Find the caravan, from: [[Lady Vess]]"],
      [7, "$", "ledger", "20 gp from Lady Vess"],
      [8, "?=", "question", "Who sent the letter: Mira"],
    ]);
  });

  it("marks an item change with its two signs and leaves a lookup written in the note as plain text", () => {
    expect(linesOf("$$ Silvered lantern :sold 30 gp\n?? letter", 0)).toEqual([
      [0, "$$", "ledger", "Silvered lantern :sold 30 gp"],
      [1, "", null, "?? letter"],
    ]);
  });

  it("skips blank lines and reads nothing from an empty note", () => {
    expect(linesOf("\n  \n? Who\n", 0)).toEqual([[2, "?", "question", "Who"]]);
    expect(linesOf("", 0)).toEqual([]);
  });
});
