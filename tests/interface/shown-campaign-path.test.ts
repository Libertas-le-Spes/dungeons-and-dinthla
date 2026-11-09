import { describe, expect, it, vi } from "vitest";
import type { App, TFile, Workspace } from "obsidian";
import { CampaignView } from "../../src/interface/campaign-view";
import { pathYouAreIn, shownCampaignPathOf } from "../../src/interface/shown-campaign-path";

function workspaceShowing(view: unknown) {
  const getActiveViewOfType = vi.fn(() => view);
  return { workspace: { getActiveViewOfType } as unknown as Workspace, getActiveViewOfType };
}

describe("shownCampaignPathOf", () => {
  it("is the note the active campaign tab shows", () => {
    const { workspace, getActiveViewOfType } = workspaceShowing({ shownPath: () => "Pale Moon/Characters/Mira.md" });
    expect(shownCampaignPathOf(workspace)).toBe("Pale Moon/Characters/Mira.md");
    expect(getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
  });

  it("is nothing when the active tab isn't the campaign tab", () => {
    const { workspace } = workspaceShowing(null);
    expect(shownCampaignPathOf(workspace)).toBeNull();
  });
});

function appShowing(view: unknown, activeFile: string | null) {
  const getActiveFile = vi.fn(() => {
    if (activeFile === null) return null;
    return { path: activeFile } as TFile;
  });
  const workspace = { getActiveViewOfType: vi.fn(() => view), getActiveFile };
  return { app: { workspace } as unknown as App, getActiveFile };
}

describe("pathYouAreIn", () => {
  it("is the session the campaign tab shows on its Notes page, over the file Obsidian last had open", () => {
    const { app, getActiveFile } = appShowing({ shownPath: () => "Pale Moon/Sessions/Session 11.md" }, "Pale Moon/Sessions/Session 12.md");
    expect(pathYouAreIn(app)).toBe("Pale Moon/Sessions/Session 11.md");
    expect(getActiveFile).not.toHaveBeenCalled();
  });

  it("is the active file when the campaign tab shows no note or isn't in front", () => {
    expect(pathYouAreIn(appShowing({ shownPath: () => null }, "Pale Moon/Sessions/Session 12.md").app)).toBe("Pale Moon/Sessions/Session 12.md");
    expect(pathYouAreIn(appShowing(null, "Pale Moon/Places/Old Mill.md").app)).toBe("Pale Moon/Places/Old Mill.md");
    expect(pathYouAreIn(appShowing(null, null).app)).toBeNull();
  });
});
