import type { App, WorkspaceLeaf } from "obsidian";
import { CampaignView } from "./campaign-view";
import type { Gate } from "../../fence/gate/gatekeeper";

function leafFor(app: App, path: string): WorkspaceLeaf {
  const view = app.workspace.getActiveViewOfType(CampaignView);
  if (view === null || view.shownPath() !== path) return app.workspace.getLeaf("tab");
  return view.leaf;
}

export async function openInEditor(app: App, gate: Gate, path: string): Promise<void> {
  const file = gate.files.getFileByPath(path);
  if (file === null) return;
  await leafFor(app, path).openFile(file);
}
