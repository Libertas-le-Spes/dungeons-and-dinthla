import type { WorkspaceLeaf } from "obsidian";
import type { EditorStep } from "./editor-step";

export interface ShownNote {
  path: string | null;
  leaf: WorkspaceLeaf;
}

export function openShownInEditor(step: EditorStep, shown: ShownNote | null, checking: boolean): boolean {
  if (shown === null) return false;
  const path = step.noteOf(shown.path);
  if (path === null) return false;
  if (!checking) step.openIn(path, shown.leaf);
  return true;
}
