import { describe, expect, it } from "vitest";
import { EditorLeaves } from "../../../src/interface/takeover/editor-leaves";

const MIRA = "Pale Moon/Characters/Mira.md";
const OLD_MILL = "Pale Moon/Places/Old Mill.md";

describe("EditorLeaves", () => {
  it("knows the tab a note was opened in Obsidian's editor in", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, MIRA);
    expect(leaves.keeps(tab, MIRA)).toBe(true);
  });

  it("knows nothing of another tab, or of another note in that tab", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, MIRA);
    expect(leaves.keeps({}, MIRA)).toBe(false);
    expect(leaves.keeps(tab, OLD_MILL)).toBe(false);
  });

  it("keeps only the latest note a tab was opened in the editor for", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, MIRA);
    leaves.keep(tab, OLD_MILL);
    expect(leaves.keeps(tab, MIRA)).toBe(false);
    expect(leaves.keeps(tab, OLD_MILL)).toBe(true);
  });
});
