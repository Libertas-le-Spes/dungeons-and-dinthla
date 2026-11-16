import type { Workspace, WorkspaceLeaf } from "obsidian";
import type { ChangeViewState } from "./view-state-patch";

function wouldChange(leaf: WorkspaceLeaf, change: ChangeViewState): boolean {
  if (leaf.isDeferred) return false;
  const viewState = leaf.getViewState();
  try {
    return change(viewState, leaf) !== viewState;
  } catch {
    return false;
  }
}

export async function takeOpenLeaves(workspace: Workspace, change: ChangeViewState): Promise<void> {
  const taken: WorkspaceLeaf[] = [];
  workspace.iterateAllLeaves((leaf) => {
    if (wouldChange(leaf, change)) taken.push(leaf);
  });
  for (const leaf of taken) await leaf.setViewState(leaf.getViewState(), leaf.getEphemeralState());
}
