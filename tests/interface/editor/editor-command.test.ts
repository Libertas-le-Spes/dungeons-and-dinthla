import { describe, expect, it } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { openShownInEditor } from "../../../src/interface/editor/editor-command";
import { FakeEditorStep } from "../fake-editor-step";

const MIRA = "Pale Moon/Characters/Mira.md";
const TAB = {} as WorkspaceLeaf;

describe("openShownInEditor", () => {
  it("is offered while the campaign tab in front shows a note, and opens nothing while Obsidian only checks", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, { path: MIRA, leaf: TAB }, true)).toBe(true);
    expect(step.opened).toEqual([]);
  });

  it("opens the note the campaign tab in front shows, in that tab", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, { path: MIRA, leaf: TAB }, false)).toBe(true);
    expect(step.opened).toEqual([{ path: MIRA, leaf: TAB }]);
  });

  it.each([null, "Pale Moon/Characters.base"])("isn't offered, and opens nothing, while the campaign tab in front shows %s", (path) => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, { path, leaf: TAB }, false)).toBe(false);
    expect(step.opened).toEqual([]);
  });

  it("isn't offered, and asks about no note, while no campaign tab is in front", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, null, false)).toBe(false);
    expect(step.asked).toEqual([]);
  });
});
