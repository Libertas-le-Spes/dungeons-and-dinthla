import { describe, expect, it, vi } from "vitest";
import type { MarkdownPostProcessorContext } from "obsidian";
import { BEFORE_OBSIDIANS_MATHS, plainDollarsProcessor } from "../../../src/obsidian/reading/plain-dollars-processor";
import { obsidianDocument } from "../../stubs/obsidian-dom";

const SESSION = "D&D/Pale Moon/Sessions/Session 1.md";
const OUTSIDE = "Maths/Proofs.md";

function isPaleMoonNote(path: string): boolean {
  return path.startsWith("D&D/Pale Moon/");
}

function contextOf(sourcePath: string): MarkdownPostProcessorContext {
  const getSectionInfo = vi.fn();
  getSectionInfo.mockReturnValue({ text: "$$ Rope :lost\n", lineStart: 0, lineEnd: 0 });
  return { sourcePath, getSectionInfo, docId: "", frontmatter: undefined, addChild: vi.fn() };
}

function drawnMaths(): HTMLElement {
  const root = obsidianDocument().createElement("div");
  root.innerHTML = '<div class="math math-block">Rope :lost</div>';
  return root;
}

describe("plainDollarsProcessor", () => {
  it("shows the maths of a campaign note as the lines written", () => {
    const root = drawnMaths();
    plainDollarsProcessor(isPaleMoonNote)(root, contextOf(SESSION));
    expect(root.innerHTML).toBe('<p class="dd-plain-lines">$$ Rope :lost</p>');
  });

  it("leaves the maths of a note outside every campaign to Obsidian", () => {
    const root = drawnMaths();
    plainDollarsProcessor(isPaleMoonNote)(root, contextOf(OUTSIDE));
    expect(root.innerHTML).toBe('<div class="math math-block">Rope :lost</div>');
  });

  it("runs before Obsidian's own maths, whose sort order is 0", () => {
    expect(BEFORE_OBSIDIANS_MATHS).toBeLessThan(0);
  });
});
