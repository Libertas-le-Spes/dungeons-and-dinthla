import { describe, expect, it, vi } from "vitest";
import { sectionTextOf, type SectionSource } from "../../src/reading/section-lines";
import { obsidianDocument } from "../stubs/obsidian-dom";

const NOTE = ["$ 5 gp rooms at the inn", "$$ Potion of healing :used", "We rested.", "? Who sent the letter"].join("\n");

function sourceGiving(lineStart: number, lineEnd: number) {
  const getSectionInfo = vi.fn();
  getSectionInfo.mockReturnValue({ text: NOTE, lineStart, lineEnd });
  const source: SectionSource = { getSectionInfo };
  return { source, getSectionInfo };
}

describe("sectionTextOf", () => {
  it("gives the lines of the note the section holds, from its first line to its last, as written", () => {
    const root = obsidianDocument().createElement("div");
    const { source, getSectionInfo } = sourceGiving(1, 2);
    expect(sectionTextOf(root, source)).toBe("$$ Potion of healing :used\nWe rested.");
    expect(getSectionInfo).toHaveBeenCalledExactlyOnceWith(root);
  });

  it("gives one line for a section of one line", () => {
    const { source } = sourceGiving(3, 3);
    expect(sectionTextOf(obsidianDocument().createElement("div"), source)).toBe("? Who sent the letter");
  });

  it("gives nothing when Obsidian can't say which lines the section holds", () => {
    const getSectionInfo = vi.fn();
    getSectionInfo.mockReturnValue(null);
    expect(sectionTextOf(obsidianDocument().createElement("div"), { getSectionInfo })).toBeNull();
  });
});
