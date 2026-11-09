import type { Workspace } from "obsidian";
import { CampaignView } from "./campaign-view";

export function shownCampaignPathOf(workspace: Workspace): string | null {
  const view = workspace.getActiveViewOfType(CampaignView);
  if (view === null) return null;
  return view.shownPath();
}
