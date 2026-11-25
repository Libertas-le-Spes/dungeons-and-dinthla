import { describe, expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "obsidian";
import { CAMPAIGN_VIEW } from "../../../src/interface/view/campaign-view";
import { welcomeOpenerOf } from "../../../src/obsidian/welcome/welcome-opener";

function appWith() {
  const newLeaf = { setViewState: vi.fn() } as unknown as WorkspaceLeaf;
  const workspace = {
    getLeavesOfType: vi.fn(() => []),
    revealLeaf: vi.fn(),
    getLeaf: vi.fn(() => newLeaf),
  };
  return { app: { workspace } as unknown as App, workspace, newLeaf };
}

describe("welcomeOpenerOf", () => {
  it("opens the campaign tab on the welcome page, the page Show this again shows", async () => {
    const { app, workspace, newLeaf } = appWith();
    await welcomeOpenerOf(app)();
    expect(newLeaf.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: { page: "welcome", path: null }, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(newLeaf);
  });

  it("opens nothing until it is called", () => {
    const { app, workspace } = appWith();
    welcomeOpenerOf(app);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
  });
});
