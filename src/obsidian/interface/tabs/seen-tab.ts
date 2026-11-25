import type { WorkspaceLeaf } from "obsidian";
import type { SeenTab } from "../../../interface/tabs/most-recent-tab";

interface LeafActivity {
  activeTime?: unknown;
}

function activeTimeOf(leaf: WorkspaceLeaf): number {
  const activeTime = (leaf as unknown as LeafActivity).activeTime;
  if (typeof activeTime !== "number") return 0;
  return activeTime;
}

export function seenTabOf(leaf: WorkspaceLeaf): SeenTab<WorkspaceLeaf> {
  return { tab: leaf, shown: leaf.view.containerEl.isShown(), activeTime: activeTimeOf(leaf) };
}
