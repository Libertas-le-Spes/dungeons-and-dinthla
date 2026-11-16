import { describe, expect, it, vi } from "vitest";
import { WorkspaceLeaf, type OpenViewState, type TFile } from "obsidian";
import { CampaignView } from "../../../src/interface/view/campaign-view";
import { ObsidianEditorStep, openInEditor, openInTab } from "../../../src/interface/view/open-in-editor";
import { EditorLeaves, editorLeavesOf } from "../../../src/interface/editor/editor-leaves";

const MOVED = "Loose notes/Old Mill.md";
const BASE = "Loose notes/Places.base";
const LOOKS_LIKE_A_NOTE = "Loose notes/Notes.md.base";
const GONE = "Loose notes/Gilded Stag.md";
const SOURCE_MODE = { state: { source: true } };

interface Opened {
  file: TFile;
  kept: boolean;
}

class FakeLeaf extends WorkspaceLeaf {
  readonly opened: Opened[] = [];
  readonly states: (OpenViewState | undefined)[] = [];
  leaves = new EditorLeaves();

  override async openFile(file: TFile, state?: OpenViewState): Promise<void> {
    this.opened.push({ file, kept: this.leaves.keeps(this, file.path) });
    this.states.push(state);
  }
}

class FakeFiles {
  constructor(private readonly files: TFile[]) {}

  getFileByPath(path: string): TFile | null {
    for (const file of this.files) {
      if (file.path === path) return file;
    }
    return null;
  }
}

class ActiveCampaignTab {
  constructor(
    private readonly shows: string,
    readonly leaf: FakeLeaf,
  ) {}

  shownPath(): string {
    return this.shows;
  }
}

function fileAt(path: string): TFile {
  return { path } as TFile;
}

function worldWith(activeShows: string | null) {
  const file = fileAt(MOVED);
  const gate = { files: new FakeFiles([file, fileAt(BASE), fileAt(LOOKS_LIKE_A_NOTE)]) };
  const workspace = { getActiveViewOfType: vi.fn(), getLeaf: vi.fn() };
  const app = { workspace };
  const leaves = editorLeavesOf(app);
  const campaignLeaf = new FakeLeaf();
  const newLeaf = new FakeLeaf();
  campaignLeaf.leaves = leaves;
  newLeaf.leaves = leaves;
  workspace.getLeaf.mockReturnValue(newLeaf);
  workspace.getActiveViewOfType.mockReturnValue(null);
  if (activeShows !== null) workspace.getActiveViewOfType.mockReturnValue(new ActiveCampaignTab(activeShows, campaignLeaf));
  return { app, workspace, gate, file, leaves, campaignLeaf, newLeaf };
}

describe("openInTab", () => {
  it("keeps the tab in the editor for the note before it opens it there in source mode", async () => {
    const { gate, file, leaves, campaignLeaf } = worldWith(MOVED);
    await openInTab(campaignLeaf, gate, MOVED, leaves);
    expect(campaignLeaf.opened).toEqual([{ file, kept: true }]);
    expect(campaignLeaf.states).toEqual([SOURCE_MODE]);
  });
});

describe("openInTab, for a note that is gone", () => {
  it("opens nothing and keeps the tab for nothing", async () => {
    const { gate, leaves, campaignLeaf } = worldWith(MOVED);
    await openInTab(campaignLeaf, gate, GONE, leaves);
    expect(campaignLeaf.opened).toEqual([]);
    expect(leaves.keeps(campaignLeaf, GONE)).toBe(false);
  });
});

describe("openInEditor", () => {
  it("opens the note in Obsidian's editor in the campaign tab that shows it, keeping that tab for the note", async () => {
    const { app, workspace, gate, file, campaignLeaf, newLeaf } = worldWith(MOVED);
    await openInEditor(app, gate, MOVED);
    expect(workspace.getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
    expect(campaignLeaf.opened).toEqual([{ file, kept: true }]);
    expect(newLeaf.opened).toEqual([]);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
  });

  it.each(["Pale Moon/Places/Gilded Stag.md", null])("opens the note in a new tab when the campaign tab in front shows %s", async (activeShows) => {
    const { app, workspace, gate, file, leaves, campaignLeaf, newLeaf } = worldWith(activeShows);
    await openInEditor(app, gate, MOVED);
    expect(workspace.getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(newLeaf.opened).toEqual([{ file, kept: true }]);
    expect(leaves.keeps(campaignLeaf, MOVED)).toBe(false);
    expect(campaignLeaf.opened).toEqual([]);
  });

  it("opens nothing, and keeps no tab in the editor, when the note is gone", async () => {
    const { app, workspace, gate, leaves, campaignLeaf, newLeaf } = worldWith(MOVED);
    await openInEditor(app, gate, GONE);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
    expect(campaignLeaf.opened).toEqual([]);
    expect(newLeaf.opened).toEqual([]);
    expect(leaves.keeps(campaignLeaf, GONE)).toBe(false);
  });
});

describe("ObsidianEditorStep", () => {
  it("offers a note the gate holds", () => {
    const { gate } = worldWith(MOVED);
    expect(new ObsidianEditorStep(gate, new EditorLeaves()).noteOf(MOVED)).toBe(MOVED);
  });

  it.each([null, GONE, BASE, LOOKS_LIKE_A_NOTE])("offers nothing for %s, which is no note the gate holds", (path) => {
    const { gate } = worldWith(MOVED);
    expect(new ObsidianEditorStep(gate, new EditorLeaves()).noteOf(path)).toBeNull();
  });

  it("opens the note in the tab it is given, in source mode, keeping that tab for the note", () => {
    const { gate, file, leaves, campaignLeaf, newLeaf } = worldWith(null);
    new ObsidianEditorStep(gate, leaves).openIn(MOVED, newLeaf);
    expect(newLeaf.opened).toEqual([{ file, kept: true }]);
    expect(newLeaf.states).toEqual([SOURCE_MODE]);
    expect(campaignLeaf.opened).toEqual([]);
  });

  it("opens nothing, and keeps no tab, for a note that is gone", () => {
    const { gate, leaves, newLeaf } = worldWith(null);
    new ObsidianEditorStep(gate, leaves).openIn(GONE, newLeaf);
    expect(newLeaf.opened).toEqual([]);
    expect(leaves.keeps(newLeaf, GONE)).toBe(false);
  });
});
