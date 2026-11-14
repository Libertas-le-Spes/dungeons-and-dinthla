import { describe, expect, it, vi } from "vitest";
import type { TFile, TFolder } from "obsidian";
import { welcomeWiring } from "../../../src/interface/sections/welcome-wiring";
import { settingsOf } from "../../../src/settings/saved/plugin-settings";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { AnsweredAgreement } from "../../welcome/page/answered-agreement";

function folderAt(path: string, foldersThere: string[]): TFolder | null {
  if (!foldersThere.includes(path)) return null;
  return { path, children: [] } as unknown as TFolder;
}

function wiredWith(foldersThere: string[]) {
  const files = {
    getFiles: vi.fn((): TFile[] => []),
    getFolderByPath: vi.fn((path: string) => folderAt(path, foldersThere)),
    namesIn: vi.fn((): string[] => []),
    createFolder: vi.fn(async (path: string) => ({ path }) as TFolder),
    create: vi.fn(async (path: string) => ({ path }) as TFile),
    removeEmptyFolder: vi.fn(async () => {}),
  };
  const folders = { folderPaths: vi.fn(() => ["D&D", "Games"]), make: vi.fn(async (typed: string) => typed) };
  const setting = { path: "D&D", choose: vi.fn(async () => {}) };
  const needs = {
    gate: { files, folders },
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
    root.querySelector("input")!.value = "Silver Road";
    const form = root.querySelector("form")!;
    form.dispatchEvent(new form.ownerDocument.defaultView!.Event("submit", { cancelable: true }));
    await settled();
    expect(files.createFolder).toHaveBeenCalledExactlyOnceWith("D&D/Silver Road");
    expect(needs.chooseCampaign).toHaveBeenCalledExactlyOnceWith("D&D/Silver Road");
  });
});
