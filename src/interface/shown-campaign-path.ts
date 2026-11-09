import type { App, Workspace } from "obsidian";
import { activePathOf } from "../views/open-view";
import { CampaignView } from "./campaign-view";

export function shownCampaignPathOf(workspace: Workspace): string | null {
  const view = workspace.getActiveViewOfType(CampaignView);
  if (view === null) return null;
  return view.shownPath();
}

export function pathYouAreIn(app: App): string | null {
  const shown = shownCampaignPathOf(app.workspace);
  if (shown !== null) return shown;
  return activePathOf(app);
}
