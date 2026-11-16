import { describe, expect, it, vi } from "vitest";
import type { MarkdownSectionInformation } from "obsidian";
import { NoteLines } from "../../src/reading/note-lines";
import { showDollarsPlain } from "../../src/reading/plain-dollars";
import type { SectionSource } from "../../src/reading/section-lines";
import { obsidianDocument } from "../stubs/obsidian-dom";

const NOTE = ["---", "played: 2026-03-14", "---", "$ 5 gp rooms at the inn", "$$ Potion of healing :used", "We rested by the [[Old Mill]].", "$$ Rope :lost", "? Who sent the letter", ""].join("\n");
const AFTER_THE_POTION = '<div class="math math-block">Potion of healing :used\nWe rested by the [[Old Mill]].\n$$ Rope :lost\n? Who sent the letter\n</div>';
const WITH_A_SECRET = ["$$ Potion of healing :used", "%% DM: Mira is the spy %%", "We rested.", "%%", "DM: the inn is hers", "%%", "<!-- DM: the rope was cut -->", "? Who sent the letter", ""].join("\n");

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
  it("shows a section Obsidian read as maths, from its $$ line to the end of the note, as the lines written", () => {
    const root = renderedSection(AFTER_THE_POTION);
    const { source, getSectionInfo } = sourceGiving(sectionHolding(NOTE, 4, 7));
    showDollarsPlain(root, source, new NoteLines());
    expect(getSectionInfo).toHaveBeenCalledExactlyOnceWith(root);
    expect(root.querySelector(".math")).toBeNull();
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$$ Potion of healing :used\nWe rested by the [[Old Mill]].\n$$ Rope :lost\n? Who sent the letter</p>');
  });

  it("shows a paragraph holding maths inline as its lines written", () => {
    const root = renderedSection('<p>$ 5 gp rooms, <span class="math math-inline">3 to Mira</span></p>');
    const { source } = sourceGiving(sectionHolding("$ 5 gp rooms, $3 to Mira$\n", 0, 0));
    showDollarsPlain(root, source, new NoteLines());
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$ 5 gp rooms, $3 to Mira$</p>');
  });

  it("leaves out the comments a section's lines hold, inline, over lines and in HTML", () => {
    const root = renderedSection('<div class="math math-block">Potion of healing :used\n%% DM: Mira is the spy %%\nWe rested.\n</div>');
    const { source } = sourceGiving(sectionHolding(WITH_A_SECRET, 0, 7));
    showDollarsPlain(root, source, new NoteLines());
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$$ Potion of healing :used\n\nWe rested.\n\n\n\n\n? Who sent the letter</p>');
  });

  it("shows each piece of maths as its own text, no longer as maths, when Obsidian can't say which lines the section holds", () => {
    const root = renderedSection('<p>Before</p><div class="math math-block">Potion of healing :used</div><span class="math math-inline">3 to Mira</span>');
    const { source } = sourceGiving(null);
    showDollarsPlain(root, source, new NoteLines());
    expect(root.innerHTML).toBe('<p>Before</p><div class="dd-plain-lines">Potion of healing :used</div><span class="dd-plain-lines">3 to Mira</span>');
  });

  it.each([
    { kind: "an Obsidian comment", maths: "Potion :used %% DM: Mira is the spy %% We rested.", shown: "Potion :used  We rested." },
    { kind: "an Obsidian comment never closed", maths: "Potion :used\n%% DM: Mira is the spy\nShe lies.", shown: "Potion :used\n\n" },
    { kind: "an HTML comment", maths: "Potion :used &lt;!-- DM: Mira is the spy --&gt; We rested.", shown: "Potion :used  We rested." },
  ])("leaves out $kind from a piece of maths shown as its own text", ({ maths, shown }) => {
    const root = renderedSection(`<div class="math math-block">${maths}</div>`);
    const { source } = sourceGiving(null);
    showDollarsPlain(root, source, new NoteLines());
    expect(root.querySelector(".dd-plain-lines")?.textContent).toBe(shown);
  });

  it("leaves a section without maths as Obsidian drew it, without asking for its lines", () => {
    const root = renderedSection("<p>$ 5 gp rooms at the inn</p>");
    const { source, getSectionInfo } = sourceGiving(sectionHolding(NOTE, 3, 3));
    showDollarsPlain(root, source, new NoteLines());
    expect(root.innerHTML).toBe("<p>$ 5 gp rooms at the inn</p>");
    expect(getSectionInfo).not.toHaveBeenCalled();
  });
});
