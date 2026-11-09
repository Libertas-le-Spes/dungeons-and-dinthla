import type { Workspace } from "obsidian";

export const RETIRED_VIEWS = [
  "dungeons-and-dinthla-questions",
  "dungeons-and-dinthla-quests",
  "dungeons-and-dinthla-funds",
  "dungeons-and-dinthla-dashboard",
];

export function closeRetiredViews(workspace: Workspace): void {
  for (const type of RETIRED_VIEWS) workspace.detachLeavesOfType(type);
}
