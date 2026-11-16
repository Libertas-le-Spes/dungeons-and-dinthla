import { describe, expect, it } from "vitest";
import { WorkspaceLeaf, type TFile } from "obsidian";
import { drawEditNoteButton } from "../../../src/interface/editor/edit-note-button";
import { EditorLeaves } from "../../../src/interface/editor/editor-leaves";
import { ObsidianEditorStep } from "../../../src/interface/view/open-in-editor";
import { FakeEditorStep } from "../fake-editor-step";
import { firstOf } from "../../stubs/lists";
import { obsidianDocument } from "../../stubs/obsidian-dom";

const MIRA = "Pale Moon/Characters/Mira.md";
const OUTSIDE = "Diary/Monday.md";

class CampaignFiles {
  getFileByPath(path: string): TFile | null {
    if (path !== MIRA) return null;
    const file: Pick<TFile, "path"> = { path };
    return file as TFile;
  }
}

function emptyRow(): HTMLElement {
  return obsidianDocument().createElement("div");
}

function buttonsIn(row: HTMLElement): HTMLButtonElement[] {
  return [...row.querySelectorAll("button")];
}

describe("drawEditNoteButton", () => {
  it("draws an Edit note button for the note shown, opening nothing yet", () => {
    const step = new FakeEditorStep([MIRA]);
    const row = emptyRow();
    drawEditNoteButton(row, step, MIRA, new WorkspaceLeaf());
    const button = firstOf(buttonsIn(row));
    expect(buttonsIn(row)).toHaveLength(1);
    expect(button.textContent).toBe("Edit note");
    expect(step.opened).toEqual([]);
  });

  it("gives the button only the quiet style, never a call to action", () => {
    const row = emptyRow();
    drawEditNoteButton(row, new FakeEditorStep([MIRA]), MIRA, new WorkspaceLeaf());
    expect(firstOf(buttonsIn(row)).className).toBe("dd-edit-note");
  });

  it("opens the note shown in Obsidian's editor, in the tab it was drawn for, when pressed", () => {
    const step = new FakeEditorStep([MIRA]);
    const tab = new WorkspaceLeaf();
    const row = emptyRow();
    drawEditNoteButton(row, step, MIRA, tab);
    firstOf(buttonsIn(row)).click();
    expect(step.opened).toEqual([{ path: MIRA, leaf: tab }]);
  });

  it.each([null, "Pale Moon/Characters.base"])("draws nothing while the tab shows %s, no note that can open in the editor", (shown) => {
    const step = new FakeEditorStep([MIRA]);
    const row = emptyRow();
    drawEditNoteButton(row, step, shown, new WorkspaceLeaf());
    expect(buttonsIn(row)).toEqual([]);
    expect(step.asked).toEqual([shown]);
  });

  it("draws nothing for a note outside the campaigns, which the fenced files don't give", () => {
    const step = new ObsidianEditorStep({ files: new CampaignFiles() }, new EditorLeaves());
    const row = emptyRow();
    drawEditNoteButton(row, step, OUTSIDE, new WorkspaceLeaf());
    expect(buttonsIn(row)).toEqual([]);
  });

  it("draws the button for a campaign note through the same step", () => {
    const step = new ObsidianEditorStep({ files: new CampaignFiles() }, new EditorLeaves());
    const row = emptyRow();
    drawEditNoteButton(row, step, MIRA, new WorkspaceLeaf());
    expect(buttonsIn(row)).toHaveLength(1);
  });
});
