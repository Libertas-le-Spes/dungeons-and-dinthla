import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { CampaignView } from "../../src/interface/campaign-view";
import { openInEditor } from "../../src/interface/open-in-editor";

const MOVED = "Loose notes/Old Mill.md";

function leaf() {
  return { openFile: vi.fn(async () => {}) };
}

function appWith(activeShows: string | null) {
  const file = { path: MOVED } as TFile;
  const campaignLeaf = leaf();
  const newLeaf = leaf();
  const getActiveViewOfType = vi.fn(() => {
    if (activeShows === null) return null;
    return { shownPath: () => activeShows, leaf: campaignLeaf };
  });
  const getLeaf = vi.fn(() => newLeaf);
  const getFileByPath = vi.fn((path: string) => {
    if (path !== MOVED) return null;
    return file;
  });
  const app = { workspace: { getActiveViewOfType, getLeaf }, vault: { getFileByPath } } as unknown as App;
  return { app, file, campaignLeaf, newLeaf, getActiveViewOfType, getLeaf };
}

describe("openInEditor", () => {
  it("opens the note in Obsidian's editor in the campaign tab that shows it", async () => {
    const { app, file, campaignLeaf, newLeaf, getActiveViewOfType, getLeaf } = appWith(MOVED);
    await openInEditor(app, MOVED);
    expect(getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
    expect(campaignLeaf.openFile).toHaveBeenCalledExactlyOnceWith(file);
    expect(newLeaf.openFile).not.toHaveBeenCalled();
    expect(getLeaf).not.toHaveBeenCalled();
  });

  it("opens the note in a new tab when the campaign tab in front shows another note or none is in front", async () => {
    for (const activeShows of ["Pale Moon/Places/Gilded Stag.md", null]) {
      const { app, file, campaignLeaf, newLeaf, getLeaf } = appWith(activeShows);
      await openInEditor(app, MOVED);
      expect(getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
      expect(newLeaf.openFile).toHaveBeenCalledExactlyOnceWith(file);
      expect(campaignLeaf.openFile).not.toHaveBeenCalled();
    }
  });

  it("opens nothing when the note is gone", async () => {
    const { app, campaignLeaf, newLeaf } = appWith(MOVED);
    await openInEditor(app, "Loose notes/Gilded Stag.md");
    expect(campaignLeaf.openFile).not.toHaveBeenCalled();
    expect(newLeaf.openFile).not.toHaveBeenCalled();
  });
});
