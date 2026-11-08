import { describe, expect, it } from "vitest";
import { appendLines, removeLines } from "../../src/notes/note-lines";

describe("appendLines", () => {
  it("adds lines at the end, after the note's last line", () => {
    expect(appendLines("? Who\n", ["?= Who: Mira"])).toBe("? Who\n?= Who: Mira\n");
    expect(appendLines("? Who", ["?= Who: Mira", "? Why"])).toBe("? Who\n?= Who: Mira\n? Why\n");
  });

  it("writes into an empty note", () => {
    expect(appendLines("", ["? Who"])).toBe("? Who\n");
  });

  it("keeps a note's Windows line endings", () => {
    expect(appendLines("? Who\r\n", ["?= Who: Mira"])).toBe("? Who\r\n?= Who: Mira\r\n");
  });

  it("leaves the note alone when there is nothing to add", () => {
    expect(appendLines("? Who", [])).toBe("? Who");
  });
});

describe("removeLines", () => {
  const isAnswer = (written: string) => written === "?= Who: Mira";

  it("removes the line where it is expected", () => {
    expect(removeLines("? Who\n?= Who: Mira\nWe rode on.", [{ line: 1, matches: isAnswer }])).toEqual({
      text: "? Who\nWe rode on.",
      removed: 1,
    });
  });

  it("removes nothing when the line has moved since it was read", () => {
    expect(removeLines("Added above.\n? Who\n?= Who: Mira", [{ line: 1, matches: isAnswer }])).toEqual({
      text: "Added above.\n? Who\n?= Who: Mira",
      removed: 0,
    });
  });

  it("removes nothing when no line matches", () => {
    expect(removeLines("? Who\n?= Who: Lady Vess", [{ line: 1, matches: isAnswer }])).toEqual({
      text: "? Who\n?= Who: Lady Vess",
      removed: 0,
    });
  });

  it("removes several lines at once, each only once", () => {
    const text = "? Who\n?+ Who: a clue\n?= Who: Mira";
    const targets = [
      { line: 0, matches: (written: string) => written === "? Who" },
      { line: 1, matches: (written: string) => written === "?+ Who: a clue" },
      { line: 2, matches: isAnswer },
    ];
    expect(removeLines(text, targets)).toEqual({ text: "", removed: 3 });
  });

  it("never removes one line for two targets", () => {
    const sameText = (written: string) => written === "? Who";
    expect(removeLines("? Who\nWe rode on.", [{ line: 0, matches: sameText }, { line: 5, matches: sameText }]).removed).toBe(1);
  });

  it("never removes a twin elsewhere when the line read was changed by hand", () => {
    const text = "? Who wrote it\n?+ Who: oil\nmid\n? Who\n";
    const isWho = (written: string) => written === "? Who";
    expect(removeLines(text, [{ line: 0, matches: isWho }])).toEqual({ text, removed: 0 });
  });

  it("removes the line read, not its twin, when two say the same", () => {
    const text = "? Who\nmid\n? Who\n";
    const isWho = (written: string) => written === "? Who";
    expect(removeLines(text, [{ line: 2, matches: isWho }]).text).toBe("? Who\nmid\n");
  });

  it("removes a line from a note with Windows line endings", () => {
    expect(removeLines("? Who\r\n?= Who: Mira\r\n", [{ line: 1, matches: isAnswer }]).text).toBe("? Who\r\n");
  });

  it("leaves no stray carriage return when the last line, with no line break, is removed", () => {
    expect(removeLines("? Who\r\n?= Who: Mira", [{ line: 1, matches: isAnswer }]).text).toBe("? Who");
  });
});
