import { describe, expect, it, vi } from "vitest";
import type { ViewState, Workspace, WorkspaceLeaf } from "obsidian";
import { takeOpenLeaves } from "../../src/interface/take-open-leaves";

const MIRA: ViewState = { type: "markdown", state: { file: "Pale Moon/Characters/Mira.md" } };
const SESSION: ViewState = { type: "markdown", state: { file: "Pale Moon/Sessions/Session 1.md" } };
const TAKEN: ViewState = { type: "dungeons-and-dinthla-campaign", state: { page: "cast", path: "Pale Moon/Characters/Mira.md" } };

function leafShowing(viewState: ViewState, isDeferred = false) {
  return {
    isDeferred,
    getViewState: () => viewState,
    getEphemeralState: () => ({ scroll: 12 }),
    setViewState: vi.fn(async () => {}),
  };
}

function workspaceWith(leaves: ReturnType<typeof leafShowing>[]): Workspace {
  const iterateAllLeaves = (visit: (leaf: WorkspaceLeaf) => void) => {
    for (const leaf of leaves) visit(leaf as unknown as WorkspaceLeaf);
  };
  return { iterateAllLeaves } as unknown as Workspace;
}

function changeMira(viewState: ViewState): ViewState {
  if (viewState === MIRA) return TAKEN;
  return viewState;
}

describe("takeOpenLeaves", () => {
  it("sets a tab already showing a campaign file again, so Obsidian opens it in the campaign tab", async () => {
    const mira = leafShowing(MIRA);
    await takeOpenLeaves(workspaceWith([mira]), changeMira);
    expect(mira.setViewState).toHaveBeenCalledExactlyOnceWith(MIRA, { scroll: 12 });
  });

  it("leaves tabs showing other files alone", async () => {
    const session = leafShowing(SESSION);
    await takeOpenLeaves(workspaceWith([session]), changeMira);
    expect(session.setViewState).not.toHaveBeenCalled();
  });

  it("leaves a tab still waiting in the background, which Obsidian sets when it is shown", async () => {
    const waiting = leafShowing(MIRA, true);
    await takeOpenLeaves(workspaceWith([waiting]), changeMira);
    expect(waiting.setViewState).not.toHaveBeenCalled();
  });

  it("leaves a tab alone when deciding fails, and goes on to the next", async () => {
    const failing = leafShowing(SESSION);
    const mira = leafShowing(MIRA);
    const change = (viewState: ViewState) => {
      if (viewState === SESSION) throw new Error("the vault isn't ready");
      return changeMira(viewState);
    };
    await takeOpenLeaves(workspaceWith([failing, mira]), change);
    expect(failing.setViewState).not.toHaveBeenCalled();
    expect(mira.setViewState).toHaveBeenCalledOnce();
  });
});
