import type { App, WorkspaceLeaf } from "obsidian";
import type { PageId } from "./campaign-pages";
import { CAMPAIGN_VIEW } from "./campaign-view";

function campaignLeafOf(app: App): WorkspaceLeaf {
  const [open] = app.workspace.getLeavesOfType(CAMPAIGN_VIEW);
  if (open !== undefined) return open;
  return app.workspace.getLeaf("tab");
}

export async function openCampaignPage(app: App, page: PageId): Promise<void> {
  const leaf = campaignLeafOf(app);
  await leaf.setViewState({ type: CAMPAIGN_VIEW, state: { page, path: null }, active: true });
  await app.workspace.revealLeaf(leaf);
}
