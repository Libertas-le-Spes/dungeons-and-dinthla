import { describe, expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "obsidian";
import { CAMPAIGN_VIEW } from "../../src/interface/campaign-view";
import { openCampaignPage } from "../../src/interface/open-campaign";

function appWith(openLeaves: WorkspaceLeaf[]) {
  const newLeaf = { setViewState: vi.fn() } as unknown as WorkspaceLeaf;
  const workspace = {
    getLeavesOfType: vi.fn(() => openLeaves),
    revealLeaf: vi.fn(),
    getLeaf: vi.fn(() => newLeaf),
  };
  return { app: { workspace } as unknown as App, workspace, newLeaf };
}

describe("openCampaignPage", () => {
  it("opens the campaign in a new tab on the page asked for", async () => {
    const { app, workspace, newLeaf } = appWith([]);
    await openCampaignPage(app, "quests");
    expect(workspace.getLeavesOfType).toHaveBeenCalledExactlyOnceWith(CAMPAIGN_VIEW);
    expect(workspace.getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(newLeaf.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "quests" }, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(newLeaf);
  });

  it("moves the tab the campaign is already open in to the page, instead of opening another", async () => {
    const open = { setViewState: vi.fn() } as unknown as WorkspaceLeaf;
    const { app, workspace } = appWith([open]);
    await openCampaignPage(app, "funds");
    expect(workspace.getLeaf).not.toHaveBeenCalled();
    expect(open.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "funds" }, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(open);
  });
});
