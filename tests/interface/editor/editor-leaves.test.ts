import { describe, expect, it } from "vitest";
import { EditorLeaves, editorLeavesOf } from "../../../src/interface/editor/editor-leaves";

const MIRA = "Pale Moon/Characters/Mira.md";
const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const MIRA_RENAMED = "Pale Moon/Characters/Mira Vane.md";

describe("EditorLeaves", () => {
  it("knows the tab a note was opened in Obsidian's editor in", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, { path: MIRA });
    expect(leaves.keeps(tab, MIRA)).toBe(true);
  });

  it("knows nothing of another tab", () => {
    const leaves = new EditorLeaves();
    leaves.keep({}, { path: MIRA });
    expect(leaves.keeps({}, MIRA)).toBe(false);
  });

  it("knows nothing of another note in that tab", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, { path: MIRA });
    expect(leaves.keeps(tab, OLD_MILL)).toBe(false);
  });

  it("keeps only the latest note a tab was opened in the editor for", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    leaves.keep(tab, { path: MIRA });
    leaves.keep(tab, { path: OLD_MILL });
    expect(leaves.keeps(tab, MIRA)).toBe(false);
    expect(leaves.keeps(tab, OLD_MILL)).toBe(true);
  });

  it("follows the note when Obsidian renames it, as Obsidian renames a file in place", () => {
    const leaves = new EditorLeaves();
    const tab = {};
    const note = { path: MIRA };
    leaves.keep(tab, note);
    note.path = MIRA_RENAMED;
    expect(leaves.keeps(tab, MIRA_RENAMED)).toBe(true);
    expect(leaves.keeps(tab, MIRA)).toBe(false);
  });
});

describe("editorLeavesOf", () => {
  it("gives the same tabs for the same app", () => {
    const app = {};
    editorLeavesOf(app).keep(app, { path: MIRA });
    expect(editorLeavesOf(app).keeps(app, MIRA)).toBe(true);
  });

  it("keeps the tabs of different apps apart", () => {
    const app = {};
    editorLeavesOf(app).keep(app, { path: MIRA });
    expect(editorLeavesOf({}).keeps(app, MIRA)).toBe(false);
  });
});
