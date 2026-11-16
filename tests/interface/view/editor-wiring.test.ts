import { describe, expect, it, vi } from "vitest";
import { WorkspaceLeaf, type TFile } from "obsidian";
import { CampaignView } from "../../../src/interface/view/campaign-view";
import { EditorWiring } from "../../../src/interface/view/editor-wiring";
import { openInEditor } from "../../../src/interface/view/open-in-editor";

const MIRA = "Pale Moon/Characters/Mira.md";
const BASE = "Pale Moon/Characters.base";

class OpeningLeaf extends WorkspaceLeaf {
  readonly opened: string[] = [];

  override async openFile(file: TFile): Promise<void> {
    this.opened.push(file.path);
  }
}

class HeldFiles {
  getFileByPath(path: string): TFile | null {
    if (path !== MIRA && path !== BASE) return null;
    return { path } as TFile;
  }
}

class ActiveCampaignTab {
  readonly leaf = new OpeningLeaf();

  constructor(private readonly shows: string | null) {}

  shownPath(): string | null {
    return this.shows;
  }
}

function wiringWith(active: ActiveCampaignTab | null) {
  const workspace = { getActiveViewOfType: vi.fn(), getLeaf: vi.fn() };
  workspace.getActiveViewOfType.mockReturnValue(active);
  const app = { workspace };
  const gate = { files: new HeldFiles() };
  return { wiring: new EditorWiring(app, gate), app, gate, workspace };
}

describe("EditorWiring", () => {
  it("names the command Open in Obsidian's editor", () => {
    const { wiring } = wiringWith(null);
    expect(wiring.command().id).toBe("open-in-editor");
    expect(wiring.command().name).toBe("Open in Obsidian's editor");
  });

  it("offers the command while the campaign tab in front shows a note, looking at that tab, and opens nothing while Obsidian only checks", () => {
    const tab = new ActiveCampaignTab(MIRA);
    const { wiring, workspace } = wiringWith(tab);
    expect(wiring.command().checkCallback(true)).toBe(true);
    expect(workspace.getActiveViewOfType).toHaveBeenCalledExactlyOnceWith(CampaignView);
    expect(tab.leaf.opened).toEqual([]);
  });

  it("opens the note in the campaign tab in front, and keeps that tab in the editor for it", () => {
    const tab = new ActiveCampaignTab(MIRA);
    const { wiring } = wiringWith(tab);
    expect(wiring.command().checkCallback(false)).toBe(true);
    expect(tab.leaf.opened).toEqual([MIRA]);
    expect(wiring.keptInEditor(tab.leaf, MIRA)).toBe(true);
  });

  it.each([new ActiveCampaignTab(null), new ActiveCampaignTab(BASE), null])("doesn't offer the command while the tab in front is %o", (active) => {
    const { wiring } = wiringWith(active);
    expect(wiring.command().checkCallback(false)).toBe(false);
  });

  it("keeps the tab its step opens a note in, so the takeover lets that tab show the note in the editor", () => {
    const { wiring } = wiringWith(null);
    const leaf = new OpeningLeaf();
    wiring.step.openIn(MIRA, leaf);
    expect(leaf.opened).toEqual([MIRA]);
    expect(wiring.keptInEditor(leaf, MIRA)).toBe(true);
    expect(wiring.keptInEditor(new OpeningLeaf(), MIRA)).toBe(false);
  });

  it("shares the tabs it keeps with a note opened in the editor from the note page", async () => {
    const tab = new ActiveCampaignTab(MIRA);
    const { wiring, app, gate } = wiringWith(tab);
    await openInEditor(app, gate, MIRA);
    expect(wiring.keptInEditor(tab.leaf, MIRA)).toBe(true);
  });
});
