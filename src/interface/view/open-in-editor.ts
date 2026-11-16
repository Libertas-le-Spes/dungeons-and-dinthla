import type { App, WorkspaceLeaf } from "obsidian";
import { CampaignView } from "./campaign-view";
import type { Gate } from "../../fence/gate/gatekeeper";
import type { EditorLeaves } from "../takeover/editor-leaves";
import type { EditorStep } from "../takeover/editor-step";

const NOTE_ENDING = ".md";

function leafFor(app: App, path: string): WorkspaceLeaf {
  const view = app.workspace.getActiveViewOfType(CampaignView);
  if (view === null || view.shownPath() !== path) return app.workspace.getLeaf("tab");
  return view.leaf;
}

export async function openInEditor(app: App, gate: Gate, leaves: EditorLeaves, path: string): Promise<void> {
  const file = gate.files.getFileByPath(path);
  if (file === null) return;
  const leaf = leafFor(app, path);
  leaves.keep(leaf, file.path);
  await leaf.openFile(file);
}

export class ObsidianEditorStep implements EditorStep {
  constructor(
    private readonly app: App,
    private readonly gate: Gate,
    private readonly leaves: EditorLeaves,
  ) {}

  noteOf(path: string | null): string | null {
    if (path === null || !path.endsWith(NOTE_ENDING)) return null;
    if (this.gate.files.getFileByPath(path) === null) return null;
    return path;
  }

  open(path: string): void {
    void openInEditor(this.app, this.gate, this.leaves, path);
  }
}
