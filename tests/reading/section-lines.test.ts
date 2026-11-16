import { describe, expect, it, vi } from "vitest";
import { NoteLines } from "../../src/reading/note-lines";
import { sectionTextOf, type SectionSource } from "../../src/reading/section-lines";
import { obsidianDocument } from "../stubs/obsidian-dom";

const NOTE = ["$ 5 gp rooms at the inn", "$$ Potion of healing :used", "We rested.", "? Who sent the letter", ""].join("\n");

function sourceGiving(text: string, lineStart: number, lineEnd: number) {
  const getSectionInfo = vi.fn();
  getSectionInfo.mockReturnValue({ text, lineStart, lineEnd });
  const source: SectionSource = { getSectionInfo };
  return { source, getSectionInfo };
}

describe("sectionTextOf", () => {
  it("gives the lines of the note the section holds, from its first line to its last, as written", () => {
    const root = obsidianDocument().createElement("div");
    const { source, getSectionInfo } = sourceGiving(NOTE, 1, 2);
    expect(sectionTextOf(root, source, new NoteLines())).toBe("$$ Potion of healing :used\nWe rested.");
    expect(getSectionInfo).toHaveBeenCalledExactlyOnceWith(root);
  });

  it("gives one line for a section of one line", () => {
    const { source } = sourceGiving(NOTE, 3, 3);
    expect(sectionTextOf(obsidianDocument().createElement("div"), source, new NoteLines())).toBe("? Who sent the letter");
  });

  it("gives the lines without a comment that opened in an earlier section", () => {
    const { source } = sourceGiving("%% DM notes\nMira is the spy\n%%\nWe rested.\n", 1, 3);
    expect(sectionTextOf(obsidianDocument().createElement("div"), source, new NoteLines())).toBe("\n\nWe rested.");
  });

  it("gives nothing when Obsidian can't say which lines the section holds", () => {
    const getSectionInfo = vi.fn();
    getSectionInfo.mockReturnValue(null);
    expect(sectionTextOf(obsidianDocument().createElement("div"), { getSectionInfo }, new NoteLines())).toBeNull();
  });
});
