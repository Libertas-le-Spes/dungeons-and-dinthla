import { describe, expect, it, vi } from "vitest";
import { welcomeSection } from "../../../src/interface/sections/welcome-section";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { AnsweredAgreement } from "../../welcome/page/answered-agreement";
import { RecordedTelling } from "../../host/showing/recorded-telling";

function made(campaignFolder: string | null, sessionNotes: SessionNote[], campaignsFolder: string | null = "D&D", foldersThere: string[] = ["D&D"]) {
  const store = { campaignFolder, sessionNotes, subscribe: () => () => {} };
  const maker = { make: vi.fn(async () => true) };
  const campaignsFolderSetup = { path: campaignsFolder, pick: vi.fn(), make: vi.fn(async () => {}) };
  const startSession = vi.fn();
  const root = obsidianDocument().body.createDiv();
  const show = vi.fn();
  const files = { hasFolder: vi.fn((path: string) => foldersThere.includes(path)) };
  const page = welcomeSection({ store, campaignsFolderSetup, maker, files, agreement: new AnsweredAgreement(), telling: new RecordedTelling(), startSession })(root, show, null, vi.fn());
  page.load();
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { root, show, maker, campaignsFolderSetup, startSession, button };
}


function send(root: HTMLElement, typed: string): void {
  const input = root.querySelector("input")!;
  const view = input.ownerDocument.defaultView!;
  input.value = typed;
  input.dispatchEvent(new view.Event("input"));
  input.dispatchEvent(new view.KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
}

const SESSION: SessionNote = { path: "D&D/Silver Road/Sessions/Session 1.md", number: 1, firstLine: 0, text: "" };

describe("welcomeSection", () => {
  it("goes to the dashboard with Go to my campaign", () => {
    const { show, button } = made("D&D/Silver Road", [SESSION]);
    button("Go to my campaign").click();
    expect(show).toHaveBeenCalledExactlyOnceWith({ page: "home", path: null });
  });

  it("starts a session with Start my first session", () => {
    const { startSession, button } = made("D&D/Silver Road", []);
    button("Start my first session").click();
    expect(startSession).toHaveBeenCalledOnce();
  });

  it("hands the typed name to the campaign maker", () => {
    const { root, maker } = made(null, []);
    send(root, "Silver Road");
    expect(maker.make).toHaveBeenCalledExactlyOnceWith("Silver Road");
  });

  it("asks for the Campaigns folder again, not for a campaign, when the saved folder is no longer there", () => {
    const { button } = made(null, [], "D&D", ["Games"]);
    expect(button("Choose a folder")).toBeDefined();
    expect(button("Make a campaign")).toBeUndefined();
  });

  it("asks for a campaign once the saved Campaigns folder is there", () => {
    const { button } = made(null, [], "D&D", ["D&D"]);
    expect(button("Make a campaign")).toBeDefined();
    expect(button("Choose a folder")).toBeUndefined();
  });

  it("asks the Campaigns folder setup to pick a folder with Choose a folder", () => {
    const { campaignsFolderSetup, button } = made(null, [], null);
    button("Choose a folder").click();
    expect(campaignsFolderSetup.pick).toHaveBeenCalledOnce();
  });

  it("hands the typed folder name to the Campaigns folder setup", () => {
    const { root, campaignsFolderSetup, maker } = made(null, [], null);
    send(root, "Games/D&D");
    expect(campaignsFolderSetup.make).toHaveBeenCalledExactlyOnceWith("Games/D&D");
    expect(maker.make).not.toHaveBeenCalled();
  });
});
