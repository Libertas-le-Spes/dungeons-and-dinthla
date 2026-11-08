import { describe, expect, it } from "vitest";
import type { App, TFile, ViewState, WorkspaceLeaf } from "obsidian";
import { activePathOf, openMainView } from "../../src/views/open-view";

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

describe("activePathOf", () => {
  const appShowing = (file: TFile | null) => ({ workspace: { getActiveFile: () => file } }) as unknown as App;

  it("gives the path of the note in front", () => {
    expect(activePathOf(appShowing({ path: "Pale Moon/Sessions/Session 2.md" } as TFile))).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("gives nothing when no note is in front", () => {
    expect(activePathOf(appShowing(null))).toBeNull();
  });
});
