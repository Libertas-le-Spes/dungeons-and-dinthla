import type { Workspace, WorkspaceLeaf } from "obsidian";
import { CampaignView } from "./campaign-view";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { editorLeavesOf, type EditorLeaves } from "../editor/editor-leaves";
import type { EditorStep } from "../editor/editor-step";

const NOTE_ENDING = ".md";
const EDITING_MODE = "source";

function livePreview(): Record<string, unknown> {
  return { mode: EDITING_MODE, source: false };
}

export interface EditorApp {
  workspace: Pick<Workspace, "getActiveViewOfType" | "getLeaf">;
}

export interface EditorGate {
  files: Pick<FencedFiles, "getFileByPath">;
}

function leafFor(app: EditorApp, path: string): WorkspaceLeaf {
  const view = app.workspace.getActiveViewOfType(CampaignView);
  if (view === null || view.shownPath() !== path) return app.workspace.getLeaf("tab");
  return view.leaf;
}

export async function openInTab(leaf: WorkspaceLeaf, gate: EditorGate, path: string, leaves: EditorLeaves): Promise<void> {
  const file = gate.files.getFileByPath(path);
  if (file === null) return;
  leaves.keep(leaf, file);
  await leaf.openFile(file, { state: livePreview() });
}

export async function openInEditor(app: EditorApp, gate: EditorGate, path: string): Promise<void> {
  if (gate.files.getFileByPath(path) === null) return;
  await openInTab(leafFor(app, path), gate, path, editorLeavesOf(app));
}

export class ObsidianEditorStep implements EditorStep {
  constructor(
    private readonly gate: EditorGate,
    private readonly leaves: EditorLeaves,
  ) {}

  noteOf(path: string | null): string | null {
    if (path === null || !path.endsWith(NOTE_ENDING)) return null;
    if (this.gate.files.getFileByPath(path) === null) return null;
    return path;
  }

  openIn(path: string, leaf: WorkspaceLeaf): void {
    void openInTab(leaf, this.gate, path, this.leaves);
  }
}
