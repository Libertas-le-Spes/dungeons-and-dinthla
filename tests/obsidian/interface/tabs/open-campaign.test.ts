import { describe, expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "obsidian";
import { CAMPAIGN_VIEW } from "../../../../src/obsidian/interface/view/campaign-view";
import { openCampaignPage } from "../../../../src/obsidian/interface/tabs/open-campaign";

function campaignLeaf(shown: boolean, activeTime: number): WorkspaceLeaf {
  return { setViewState: vi.fn(), activeTime, view: { containerEl: { isShown: () => shown } } } as unknown as WorkspaceLeaf;
}

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
    await openCampaignPage(app, "quests", null);
    expect(workspace.getLeavesOfType).toHaveBeenCalledExactlyOnceWith(CAMPAIGN_VIEW);
    expect(workspace.getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
    expect(newLeaf.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "quests", path: null }, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(newLeaf);
  });

  it("moves the tab the campaign is already open in to the page, instead of opening another", async () => {
    const open = campaignLeaf(true, 1);
    const { app, workspace } = appWith([open]);
    await openCampaignPage(app, "funds", null);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
    expect(open.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "funds", path: null }, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(open);
  });

  it("moves the campaign tab in view that was used last, of several", async () => {
    const behind = campaignLeaf(false, 30);
    const left = campaignLeaf(true, 10);
    const right = campaignLeaf(true, 20);
    const { app, workspace } = appWith([behind, left, right]);
    await openCampaignPage(app, "home", null);
    expect(right.setViewState).toHaveBeenCalledOnce();
    expect(left.setViewState).not.toHaveBeenCalled();
    expect(behind.setViewState).not.toHaveBeenCalled();
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(right);
  });

  it("opens the page on the note asked for, such as a session on the Notes page", async () => {
    const open = campaignLeaf(true, 1);
    const { app } = appWith([open]);
    await openCampaignPage(app, "notes", "Pale Moon/Sessions/Session 4.md");
    expect(open.setViewState).toHaveBeenCalledExactlyOnceWith({
      type: CAMPAIGN_VIEW,
      state: { page: "notes", path: "Pale Moon/Sessions/Session 4.md" },
      active: true,
    });
  });
});
