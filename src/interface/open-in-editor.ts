import type { App, WorkspaceLeaf } from "obsidian";
import { CampaignView } from "./campaign-view";

function leafFor(app: App, path: string): WorkspaceLeaf {
  const view = app.workspace.getActiveViewOfType(CampaignView);
  if (view === null || view.shownPath() !== path) return app.workspace.getLeaf("tab");
  return view.leaf;
}

export async function openInEditor(app: App, path: string): Promise<void> {
  const file = app.vault.getFileByPath(path);
  if (file === null) return;
  await leafFor(app, path).openFile(file);
}
