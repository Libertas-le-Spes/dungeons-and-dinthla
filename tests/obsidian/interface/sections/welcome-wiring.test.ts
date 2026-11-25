import { STUB_SPELLING } from "../../../host/stub-spelling";
import { describe, expect, it, vi } from "vitest";
import { welcomeWiring } from "../../../../src/obsidian/interface/sections/welcome-wiring";
import { settingsOf } from "../../../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../../../src/settings/saved/settings-saver";
import { obsidianDocument } from "../../../stubs/obsidian-dom";
import { AnsweredAgreement } from "../../../welcome/page/answered-agreement";
import type { NoteRef } from "../../../../src/host/notes/note-ref";
import { fileAt } from "../../../stubs/note-files";
import { OBSIDIAN_TELLING } from "../../../../src/obsidian/views/frames/obsidian-telling";


function wiredWith(foldersThere: string[]) {
  const files = {
    files: vi.fn((): NoteRef[] => []),
    hasFolder: vi.fn((path: string) => foldersThere.includes(path)),
    namesIn: vi.fn((): string[] => []),
    makeFolder: vi.fn(async () => {}),
    make: vi.fn(async (path: string) => fileAt(path)),
    removeEmptyFolder: vi.fn(async () => {}),
  };
  const folders = { folderPaths: vi.fn(() => ["D&D", "Games"]), make: vi.fn(async (typed: string) => typed) };
  const setting = { path: "D&D", choose: vi.fn(async () => {}) };
  const needs = {
    gate: { notes: { store: files }, folders },
    store: { campaignFolder: null, sessionNotes: [], subscribe: () => () => {} },
    saver: new SettingsSaver(settingsOf(null, ".obsidian"), async () => {}),
    manifest: { version: "1.0.0" },
    setting,
    campaignFolders: vi.fn((): string[] => []),
    chooseCampaign: vi.fn(async () => {}),
    openWelcome: vi.fn(async () => {}),
    pickFolder: vi.fn(),
    agreement: new AnsweredAgreement(),
    startSession: vi.fn(),
    spelling: STUB_SPELLING,
    telling: OBSIDIAN_TELLING,
  };
  return { wiring: welcomeWiring(needs), needs, files };
}

function shownWelcome(wiring: ReturnType<typeof welcomeWiring>): HTMLElement {
  const root = obsidianDocument().body.createDiv();
  wiring.welcome(root, vi.fn(), null, vi.fn()).load();
  return root;
}

function buttonTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll("button")].map((button) => String(button.textContent));
}

async function settled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("welcomeWiring", () => {
  it("shows the welcome page through the opener it is given", async () => {
    const { wiring, needs } = wiredWith(["D&D"]);
    await wiring.help.showWelcome();
    expect(needs.openWelcome).toHaveBeenCalledOnce();
  });

  it("offers the folders the gate lists when picking the Campaigns folder", () => {
    const { wiring, needs } = wiredWith(["D&D"]);
    wiring.campaignsFolderSetup.pick(vi.fn());
    expect(needs.pickFolder).toHaveBeenCalledExactlyOnceWith(["D&D", "Games"], expect.any(Function));
  });

  it("asks for a campaign while the saved Campaigns folder is there", () => {
    const { wiring } = wiredWith(["D&D"]);
    expect(buttonTexts(shownWelcome(wiring))).toEqual(["Make a campaign"]);
  });

  it("asks for the Campaigns folder again while the saved one isn't there", () => {
    const { wiring } = wiredWith(["Games"]);
    expect(buttonTexts(shownWelcome(wiring))).toEqual(["Choose a folder", "Make the folder"]);
  });

  it("makes a typed campaign inside the saved Campaigns folder through the fenced files and moves into it", async () => {
    const { wiring, needs, files } = wiredWith(["D&D"]);
    const root = shownWelcome(wiring);
    const input = root.querySelector("input")!;
    const view = input.ownerDocument.defaultView!;
    input.value = "Silver Road";
    input.dispatchEvent(new view.Event("input"));
    input.dispatchEvent(new view.KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    await settled();
    expect(files.makeFolder).toHaveBeenCalledExactlyOnceWith("D&D/Silver Road");
    expect(needs.chooseCampaign).toHaveBeenCalledExactlyOnceWith("D&D/Silver Road");
  });
});
