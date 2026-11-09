import { describe, expect, it, vi } from "vitest";
import type { ViewState, Workspace, WorkspaceLeaf } from "obsidian";
import { CAMPAIGN_VIEW } from "../../src/interface/campaign-view";
import { keepOneCampaignTab } from "../../src/interface/one-campaign-tab";

const MIRA_NOTE: ViewState = { type: "markdown", state: { file: "Pale Moon/Characters/Mira.md" } };
const MIRA_SHEET: ViewState = { type: CAMPAIGN_VIEW, state: { page: "cast", path: "Pale Moon/Characters/Mira.md" } };
const OPENED_MIRA = { typeBefore: "markdown", incoming: MIRA_NOTE, sent: MIRA_SHEET };
const MAIN_WINDOW = { name: "main window" };

interface LeafSetup {
  backHistory?: unknown[];
  setFails?: boolean;
}

function campaignLeaf({ backHistory = [], setFails = false }: LeafSetup = {}) {
  return {
    view: { getViewType: () => CAMPAIGN_VIEW, containerEl: { isShown: () => true } },
    activeTime: 5,
    history: { backHistory, back: vi.fn(async () => {}) },
    getViewState: () => ({ type: CAMPAIGN_VIEW, state: {} }),
    getContainer: () => MAIN_WINDOW,
    setViewState: vi.fn(async () => {
      if (setFails) throw new Error("the tab is busy");
    }),
    detach: vi.fn(),
  };
}

type StandInLeaf = ReturnType<typeof campaignLeaf>;

function setUp(open: StandInLeaf[], opened: StandInLeaf) {
  const workspace = {
    layoutReady: true,
    getLeavesOfType: vi.fn(() => [...open, opened]),
    revealLeaf: vi.fn(async () => {}),
  };
  const waiting: (() => void)[] = [];
  const settled = keepOneCampaignTab(workspace as unknown as Workspace, (run) => waiting.push(run));
  const tell = () => settled(opened as unknown as WorkspaceLeaf, OPENED_MIRA);
  const runWaiting = async () => {
    for (const run of waiting) run();
    await new Promise((done) => setTimeout(done, 0));
  };
  return { workspace, tell, waiting, runWaiting };
}

describe("keepOneCampaignTab", () => {
  it("shows the opened file in the campaign tab already open, and closes the new tab", async () => {
    const open = campaignLeaf();
    const opened = campaignLeaf();
    const { workspace, tell, runWaiting } = setUp([open], opened);
    tell();
    await runWaiting();
    expect(open.setViewState).toHaveBeenCalledExactlyOnceWith({ type: CAMPAIGN_VIEW, state: MIRA_SHEET.state, active: true });
    expect(workspace.revealLeaf).toHaveBeenCalledExactlyOnceWith(open);
    expect(opened.detach).toHaveBeenCalledOnce();
    expect(opened.history.back).not.toHaveBeenCalled();
  });

  it("takes the new tab back to what it showed before, when it showed something", async () => {
    const open = campaignLeaf();
    const opened = campaignLeaf({ backHistory: [{ type: "markdown" }] });
    const { tell, runWaiting } = setUp([open], opened);
    tell();
    await runWaiting();
    expect(opened.history.back).toHaveBeenCalledOnce();
    expect(opened.detach).not.toHaveBeenCalled();
  });

  it("waits until whoever opened the file has finished with the tab", () => {
    const open = campaignLeaf();
    const opened = campaignLeaf();
    const { tell, waiting } = setUp([open], opened);
    tell();
    expect(waiting).toHaveLength(1);
    expect(open.setViewState).not.toHaveBeenCalled();
    expect(opened.detach).not.toHaveBeenCalled();
  });

  it("leaves the new tab showing the file when the open tab can't take it", async () => {
    const open = campaignLeaf({ setFails: true });
    const opened = campaignLeaf();
    const { workspace, tell, runWaiting } = setUp([open], opened);
    tell();
    await runWaiting();
    expect(open.setViewState).toHaveBeenCalledOnce();
    expect(workspace.revealLeaf).not.toHaveBeenCalled();
    expect(opened.detach).not.toHaveBeenCalled();
    expect(opened.history.back).not.toHaveBeenCalled();
  });

  it("keeps the new tab when it is the only campaign tab", async () => {
    const opened = campaignLeaf();
    const { workspace, tell, runWaiting } = setUp([], opened);
    tell();
    await runWaiting();
    expect(workspace.revealLeaf).not.toHaveBeenCalled();
    expect(opened.setViewState).not.toHaveBeenCalled();
    expect(opened.detach).not.toHaveBeenCalled();
  });
});
