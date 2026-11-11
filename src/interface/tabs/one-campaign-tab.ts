import type { Workspace, WorkspaceLeaf } from "obsidian";
import { CAMPAIGN_VIEW } from "../view/campaign-view";
import { campaignTabToMoveInto, type OtherCampaignTab } from "./second-campaign-tab";
import { seenTabOf } from "./seen-tab";
import type { SetStep, ViewStateSettled } from "../takeover/view-state-patch";

export type RunLater = (run: () => void) => void;

interface LeafHistory {
  backHistory: unknown[];
  back(): Promise<void>;
}

interface LeafWithHistory {
  history?: unknown;
}

function otherCampaignTab(leaf: WorkspaceLeaf, other: WorkspaceLeaf): OtherCampaignTab<WorkspaceLeaf> {
  const pinned = other.getViewState().pinned === true;
  const sameWindow = other.getContainer() === leaf.getContainer();
  return { ...seenTabOf(other), pinned, sameWindow };
}

function otherCampaignTabsOf(workspace: Workspace, leaf: WorkspaceLeaf): OtherCampaignTab<WorkspaceLeaf>[] {
  const others = workspace.getLeavesOfType(CAMPAIGN_VIEW).filter((other) => other !== leaf);
  return others.map((other) => otherCampaignTab(leaf, other));
}

function tabToMoveInto(workspace: Workspace, leaf: WorkspaceLeaf, step: SetStep): WorkspaceLeaf | null {
  const opening = { layoutReady: workspace.layoutReady, step, typeNow: leaf.view.getViewType() };
  return campaignTabToMoveInto(opening, otherCampaignTabsOf(workspace, leaf));
}

async function showInOpenTab(workspace: Workspace, open: WorkspaceLeaf, step: SetStep): Promise<void> {
  await open.setViewState({ type: CAMPAIGN_VIEW, state: step.sent.state, active: true });
  await workspace.revealLeaf(open);
}

function isLeafHistory(history: unknown): history is LeafHistory {
  if (typeof history !== "object" || history === null) return false;
  const candidate = history as Partial<LeafHistory>;
  const hasBackHistory = Array.isArray(candidate.backHistory);
  const canGoBack = typeof candidate.back === "function";
  return hasBackHistory && canGoBack;
}

async function goBackOrClose(leaf: WorkspaceLeaf, history: LeafHistory): Promise<void> {
  if (history.backHistory.length > 0) {
    await history.back();
    return;
  }
  leaf.detach();
}

async function putBack(leaf: WorkspaceLeaf): Promise<void> {
  const history = (leaf as unknown as LeafWithHistory).history;
  if (isLeafHistory(history)) await goBackOrClose(leaf, history);
}

async function moveIntoOpenTab(workspace: Workspace, leaf: WorkspaceLeaf, step: SetStep): Promise<void> {
  try {
    const open = tabToMoveInto(workspace, leaf, step);
    if (open === null) return;
    await showInOpenTab(workspace, open, step);
    await putBack(leaf);
  } catch {
    return;
  }
}

export function keepOneCampaignTab(workspace: Workspace, later: RunLater): ViewStateSettled {
  return (leaf, step) => later(() => void moveIntoOpenTab(workspace, leaf, step));
}
