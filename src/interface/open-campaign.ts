import type { App, WorkspaceLeaf } from "obsidian";
import type { PageId } from "./campaign-pages";
import { CAMPAIGN_VIEW } from "./campaign-view";
import { mostRecentTab } from "./most-recent-tab";
import { seenTabOf } from "./seen-tab";

function campaignLeafOf(app: App): WorkspaceLeaf {
  const open = mostRecentTab(app.workspace.getLeavesOfType(CAMPAIGN_VIEW).map(seenTabOf));
  if (open !== null) return open;
  return app.workspace.getLeaf("tab");
}

export async function openCampaignPage(app: App, page: PageId, path: string | null): Promise<void> {
  const leaf = campaignLeafOf(app);
  await leaf.setViewState({ type: CAMPAIGN_VIEW, state: { page, path }, active: true });
  await app.workspace.revealLeaf(leaf);
}
