import { describe, expect, it, vi } from "vitest";
import type { MarkdownSectionInformation } from "obsidian";
import { showDollarsPlain } from "../../src/reading/plain-dollars";
import type { SectionSource } from "../../src/reading/section-lines";
import { obsidianDocument } from "../stubs/obsidian-dom";

const NOTE = ["---", "played: 2026-03-14", "---", "$ 5 gp rooms at the inn", "$$ Potion of healing :used", "We rested by the [[Old Mill]].", "$$ Rope :lost", "? Who sent the letter"].join("\n");

function sectionHolding(text: string, lineStart: number, lineEnd: number): MarkdownSectionInformation {
  return { text, lineStart, lineEnd };
}

function sourceGiving(section: MarkdownSectionInformation | null) {
  const getSectionInfo = vi.fn();
  getSectionInfo.mockReturnValue(section);
  const source: SectionSource = { getSectionInfo };
  return { source, getSectionInfo };
}

function renderedSection(html: string): HTMLElement {
  const root = obsidianDocument().createElement("div");
  root.innerHTML = html;
  return root;
}

describe("showDollarsPlain", () => {
  it("shows a section Obsidian read as maths as the lines written, in place of the maths", () => {
    const root = renderedSection('<div class="math math-block">Potion of healing :used\nWe rested by the [[Old Mill]].\n</div>');
    const { source, getSectionInfo } = sourceGiving(sectionHolding(NOTE, 4, 6));
    showDollarsPlain(root, source);
    expect(getSectionInfo).toHaveBeenCalledExactlyOnceWith(root);
    expect(root.querySelector(".math")).toBeNull();
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$$ Potion of healing :used\nWe rested by the [[Old Mill]].\n$$ Rope :lost</p>');
  });

  it("shows a paragraph holding maths inline as its lines written", () => {
    const root = renderedSection('<p>$ 5 gp rooms, <span class="math math-inline">3 to Mira</span></p>');
    const { source } = sourceGiving(sectionHolding("$ 5 gp rooms, $3 to Mira$", 0, 0));
    showDollarsPlain(root, source);
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$ 5 gp rooms, $3 to Mira$</p>');
  });

  it("shows each piece of maths as its own text, no longer as maths, when Obsidian can't say which lines the section holds", () => {
    const root = renderedSection('<p>Before</p><div class="math math-block">Potion of healing :used</div><span class="math math-inline">3 to Mira</span>');
    const { source } = sourceGiving(null);
    showDollarsPlain(root, source);
    expect(root.innerHTML).toBe('<p>Before</p><div class="dd-plain-lines">Potion of healing :used</div><span class="dd-plain-lines">3 to Mira</span>');
  });

  it("leaves a section without maths as Obsidian drew it, without asking for its lines", () => {
    const root = renderedSection("<p>$ 5 gp rooms at the inn</p>");
    const { source, getSectionInfo } = sourceGiving(sectionHolding(NOTE, 3, 3));
    showDollarsPlain(root, source);
    expect(root.innerHTML).toBe("<p>$ 5 gp rooms at the inn</p>");
    expect(getSectionInfo).not.toHaveBeenCalled();
  });
});
