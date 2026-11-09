import { describe, expect, it, vi } from "vitest";
import { welcomeSection } from "../../src/interface/welcome-section";
import type { SessionNote } from "../../src/campaign/campaign";
import { obsidianDocument } from "../views/obsidian-dom";

function made(campaignFolder: string | null, sessionNotes: SessionNote[]) {
  const store = { campaignFolder, sessionNotes, subscribe: () => () => {} };
  const maker = { make: vi.fn(async () => {}) };
  const startSession = vi.fn();
  const root = obsidianDocument().body.createDiv();
  const show = vi.fn();
  const page = welcomeSection({ store, maker, startSession })(root, show, null, vi.fn());
  page.load();
  const button = (text: string) => Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === text)!;
  return { root, show, maker, startSession, button };
}

const SESSION: SessionNote = { path: "Silver Road/Sessions/Session 1.md", number: 1, firstLine: 0, text: "" };

describe("welcomeSection", () => {
  it("goes to the dashboard with Go to my campaign", () => {
    const { show, button } = made("Silver Road", [SESSION]);
    button("Go to my campaign").click();
    expect(show).toHaveBeenCalledExactlyOnceWith({ page: "home", path: null });
  });

  it("starts a session with Start my first session", () => {
    const { startSession, button } = made("Silver Road", []);
    button("Start my first session").click();
    expect(startSession).toHaveBeenCalledOnce();
  });

  it("hands the typed name to the campaign maker", () => {
    const { root, maker } = made(null, []);
    root.querySelector("input")!.value = "Silver Road";
    const form = root.querySelector("form")!;
    form.dispatchEvent(new form.ownerDocument.defaultView!.Event("submit", { cancelable: true }));
    expect(maker.make).toHaveBeenCalledExactlyOnceWith("Silver Road");
  });
});
