import { describe, expect, it, vi } from "vitest";
import { welcomeSection } from "../../src/interface/welcome-section";
import type { SessionNote } from "../../src/campaign/campaign";
import { obsidianDocument } from "../views/obsidian-dom";

function made(campaignFolder: string | null, sessionNotes: SessionNote[], campaignsFolderPath: string | null = "D&D") {
  const store = { campaignFolder, sessionNotes, subscribe: () => () => {} };
  const maker = { make: vi.fn(async () => {}) };
  const campaignsFolder = { path: campaignsFolderPath, pick: vi.fn(), make: vi.fn(async () => {}) };
  const startSession = vi.fn();
  const root = obsidianDocument().body.createDiv();
  const show = vi.fn();
  const page = welcomeSection({ store, campaignsFolder, maker, startSession })(root, show, null, vi.fn());
  page.load();
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { root, show, maker, campaignsFolder, startSession, button };
}

function send(root: HTMLElement, typed: string): void {
  root.querySelector("input")!.value = typed;
  const form = root.querySelector("form")!;
  form.dispatchEvent(new form.ownerDocument.defaultView!.Event("submit", { cancelable: true }));
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

  it("asks the Campaigns folder setup to pick a folder with Choose a folder", () => {
    const { campaignsFolder, button } = made(null, [], null);
    button("Choose a folder").click();
    expect(campaignsFolder.pick).toHaveBeenCalledOnce();
  });

  it("hands the typed folder name to the Campaigns folder setup", () => {
    const { root, campaignsFolder, maker } = made(null, [], null);
    send(root, "Games/D&D");
    expect(campaignsFolder.make).toHaveBeenCalledExactlyOnceWith("Games/D&D");
    expect(maker.make).not.toHaveBeenCalled();
  });
});
