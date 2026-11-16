import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { CampaignView } from "../../../src/interface/view/campaign-view";
import { ObsidianEditorStep, openInEditor } from "../../../src/interface/view/open-in-editor";
import { EditorLeaves } from "../../../src/interface/takeover/editor-leaves";
import type { Gate } from "../../../src/fence/gate/gatekeeper";

const MOVED = "Loose notes/Old Mill.md";
const BASE = "Loose notes/Places.base";

class FakeLeaf {
  readonly keptWhenOpened: boolean[] = [];
  readonly openFile = vi.fn(this.opened.bind(this));

  constructor(private readonly leaves: EditorLeaves) {}

  private async opened(file: TFile): Promise<void> {
    this.keptWhenOpened.push(this.leaves.keeps(this, file.path));
  }
}

function appWith(activeShows: string | null) {
  const file = { path: MOVED } as TFile;
  const base = { path: BASE } as TFile;
  const leaves = new EditorLeaves();
  const campaignLeaf = new FakeLeaf(leaves);
  const newLeaf = new FakeLeaf(leaves);
  const getActiveViewOfType = vi.fn(() => {
    if (activeShows === null) return null;
    return { shownPath: () => activeShows, leaf: campaignLeaf };
  });
  const getLeaf = vi.fn(() => newLeaf);
  const getFileByPath = vi.fn((path: string) => {
    if (path === BASE) return base;
    if (path !== MOVED) return null;
    return file;
  });
  const app = { workspace: { getActiveViewOfType, getLeaf } } as unknown as App;
  const gate = { files: { getFileByPath } } as unknown as Gate;
  return { app, gate, file, leaves, campaignLeaf, newLeaf, getActiveViewOfType, getLeaf };
}

describe("openInEditor", () => {
  it("opens the note in Obsidian's editor in the campaign tab that shows it, keeping that tab in the editor before it opens", async () => {
    const { app, gate, file, leaves, campaignLeaf, newLeaf, getActiveViewOfType, getLeaf } = appWith(MOVED);
    await openInEditor(app, gate, leaves, MOVED);
    expect(getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
    expect(campaignLeaf.openFile).toHaveBeenCalledExactlyOnceWith(file);
    expect(campaignLeaf.keptWhenOpened).toEqual([true]);
    expect(newLeaf.openFile).not.toHaveBeenCalled();
    expect(getLeaf).not.toHaveBeenCalled();
  });

  it("opens the note in a new tab when the campaign tab in front shows another note or none is in front", async () => {
    for (const activeShows of ["Pale Moon/Places/Gilded Stag.md", null]) {
      const { app, gate, file, leaves, campaignLeaf, newLeaf, getLeaf } = appWith(activeShows);
      await openInEditor(app, gate, leaves, MOVED);
      expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
      expect(newLeaf.openFile).toHaveBeenCalledExactlyOnceWith(file);
      expect(newLeaf.keptWhenOpened).toEqual([true]);
      expect(leaves.keeps(campaignLeaf, MOVED)).toBe(false);
      expect(campaignLeaf.openFile).not.toHaveBeenCalled();
    }
  });

  it("opens nothing, and keeps no tab in the editor, when the note is gone", async () => {
    const { app, gate, leaves, campaignLeaf, newLeaf } = appWith(MOVED);
    await openInEditor(app, gate, leaves, "Loose notes/Gilded Stag.md");
    expect(campaignLeaf.openFile).not.toHaveBeenCalled();
    expect(newLeaf.openFile).not.toHaveBeenCalled();
    expect(leaves.keeps(campaignLeaf, "Loose notes/Gilded Stag.md")).toBe(false);
  });
});

describe("ObsidianEditorStep", () => {
  it("offers a note the gate holds", () => {
    const { app, gate, leaves } = appWith(MOVED);
    expect(new ObsidianEditorStep(app, gate, leaves).noteOf(MOVED)).toBe(MOVED);
  });

  it("offers nothing for no note, a note that is gone, or a file that isn't a note", () => {
    const { app, gate, leaves } = appWith(MOVED);
    const step = new ObsidianEditorStep(app, gate, leaves);
    expect(step.noteOf(null)).toBeNull();
    expect(step.noteOf("Loose notes/Gilded Stag.md")).toBeNull();
    expect(step.noteOf(BASE)).toBeNull();
  });

  it("opens the note in the campaign tab that shows it", () => {
    const { app, gate, file, leaves, campaignLeaf } = appWith(MOVED);
    new ObsidianEditorStep(app, gate, leaves).open(MOVED);
    expect(campaignLeaf.openFile).toHaveBeenCalledExactlyOnceWith(file);
  });
});
