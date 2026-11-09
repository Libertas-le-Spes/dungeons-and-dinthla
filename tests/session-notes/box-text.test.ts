import { describe, expect, it } from "vitest";
import { lineAt, startOfLine, withoutLine } from "../../src/session-notes/box-text";

const BOX = "? Who\n?? letter\nTracks";

describe("lineAt", () => {
  it("finds the line the caret is on", () => {
    expect(lineAt(BOX, 0)).toEqual({ index: 0, text: "? Who" });
    expect(lineAt(BOX, 8)).toEqual({ index: 1, text: "?? letter" });
    expect(lineAt(BOX, BOX.length)).toEqual({ index: 2, text: "Tracks" });
  });

  it("finds an empty line after a last line break", () => {
    expect(lineAt("? Who\n", 6)).toEqual({ index: 1, text: "" });
  });
});

describe("withoutLine", () => {
  it("removes one line with its line break", () => {
    expect(withoutLine(BOX, 1)).toBe("? Who\nTracks");
    expect(withoutLine(BOX, 2)).toBe("? Who\n?? letter");
    expect(withoutLine("?? letter", 0)).toBe("");
  });
});

describe("startOfLine", () => {
  it("is where a line starts, or the end of the text past its last line", () => {
    expect(startOfLine(BOX, 0)).toBe(0);
    expect(startOfLine(BOX, 1)).toBe(6);
    expect(startOfLine("? Who", 1)).toBe(5);
  });
});
