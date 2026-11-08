import { describe, expect, it } from "vitest";
import type { App, ViewState, WorkspaceLeaf } from "obsidian";
import { openMainView } from "../../src/views/open-view";

function appWith(openLeaves: WorkspaceLeaf[]) {
  const revealed: WorkspaceLeaf[] = [];
  const states: ViewState[] = [];
  const asked: unknown[] = [];
  const newLeaf = { setViewState: async (state: ViewState) => void states.push(state) } as unknown as WorkspaceLeaf;
  const app = {
    workspace: {
      getLeavesOfType: () => openLeaves,
      revealLeaf: async (leaf: WorkspaceLeaf) => void revealed.push(leaf),
      getLeaf: (where: unknown) => {
        asked.push(where);
        return newLeaf;
      },
    },
  } as unknown as App;
  return { app, revealed, states, asked };
}

describe("openMainView", () => {
  it("opens the view in a new tab", async () => {
    const { app, states, asked } = appWith([]);
    await openMainView(app, "dashboard");
    expect(asked).toEqual(["tab"]);
    expect(states).toEqual([{ type: "dashboard", active: true }]);
  });

  it("shows the tab it is already open in instead of opening another", async () => {
    const open = {} as WorkspaceLeaf;
    const { app, revealed, states } = appWith([open]);
    await openMainView(app, "dashboard");
    expect(revealed).toEqual([open]);
    expect(states).toEqual([]);
  });
});
