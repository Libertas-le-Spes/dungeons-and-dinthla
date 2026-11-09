import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import type { AppendWriter } from "../../src/session-notes/append-writer";
import { Drafts } from "../../src/session-notes/drafts";
import { SessionNotesPage } from "../../src/session-notes/session-notes-page";
import type { SessionProperties } from "../../src/sessions/session-properties";
import { obsidianDocument } from "../views/obsidian-dom";

const FOLDER = "Pale Moon";

function sessionOf(number: number, lines: string[], name = `Session ${number}`): SessionNote {
  return { path: `${FOLDER}/Sessions/${name}.md`, number, firstLine: 0, text: lines.join("\n") };
}

const TITLES: Record<string, SessionProperties> = {
  [`${FOLDER}/Sessions/Session 12.md`]: { title: "The Old Mill", played: "2026-11-09" },
  [`${FOLDER}/Sessions/Session 11.md`]: { title: "", played: "2026-11-02" },
};

function propertiesOf(path: string): SessionProperties {
  const properties = TITLES[path];
  if (properties === undefined) return { title: "", played: "" };
  return properties;
}

function pageWith(sessions: SessionNote[], asked: string | null, { folder = FOLDER as string | null, drafts = new Drafts() } = {}) {
  let listener = () => {};
  const unsubscribe = vi.fn();
  const store = {
    campaignFolder: folder,
    sessionNotes: sessions,
    current: buildCampaign(sessions),
    subscribe: (next: () => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const change = (next: SessionNote[]) => {
    store.sessionNotes = next;
    store.current = buildCampaign(next);
    listener();
  };
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const moves = { showSession: vi.fn(), startSession: vi.fn() };
  const writer = { save: vi.fn(async () => "") };
  const needs = {
    store: store as unknown as CampaignStore,
    drafts,
    writer: writer as unknown as AppendWriter,
    propertiesOf,
    openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
    actions: { openRow: vi.fn(), openLink: vi.fn() },
  };
  const page = new SessionNotesPage(root, asked, needs, moves);
  page.load();
  const select = () => root.querySelector("select")!;
  const lineTexts = () => Array.from(root.querySelectorAll(".dd-written-line .dd-line-text")).map((line) => line.textContent);
  return { root, page, moves, writer, change, unsubscribe, select, lineTexts, drafts };
}

const SESSIONS = [
  sessionOf(11, ["? Who sent the letter"]),
  sessionOf(12, ["Tracks lead to the [[Old Mill]].", "! Find the caravan"]),
  sessionOf(3, []),
];

describe("SessionNotesPage", () => {
  it("heads the page with the session shown, and lists the sessions newest first to switch between", () => {
    const { root, select } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 11");
    expect(select().getAttribute("aria-label")).toBe("Session");
    expect(Array.from(select().options).map((option) => option.textContent)).toEqual([
      "Session 12 · The Old Mill · 9 Nov 2026",
      "Session 11 · 2 Nov 2026",
      "Session 3",
    ]);
    expect(select().value).toBe(`${FOLDER}/Sessions/Session 11.md`);
  });

  it("shows the latest session when none is asked for", () => {
    const { root, select, lineTexts } = pageWith(SESSIONS, null);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 12 · The Old Mill");
    expect(select().value).toBe(`${FOLDER}/Sessions/Session 12.md`);
    expect(lineTexts()).toEqual(["Tracks lead to the [[Old Mill]].", "Find the caravan"]);
  });

  it("asks the tab to show another session when one is chosen", () => {
    const { select, moves } = pageWith(SESSIONS, null);
    const picker = select();
    picker.value = `${FOLDER}/Sessions/Session 3.md`;
    picker.dispatchEvent(new picker.ownerDocument.defaultView!.Event("change"));
    expect(moves.showSession).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 3.md`);
  });

  it("starts a new session from its button", () => {
    const { root, moves } = pageWith(SESSIONS, null);
    const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === "New session")!;
    button.click();
    expect(moves.startSession).toHaveBeenCalledOnce();
  });

  it("puts the box in front, holding this session's draft, and saves into this session", async () => {
    const drafts = new Drafts();
    drafts.keep(`${FOLDER}/Sessions/Session 11.md`, "? Why does the wheel turn");
    const { root, writer } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`, { drafts });
    const box = root.querySelector("textarea")!;
    expect(box.value).toBe("? Why does the wheel turn");
    expect(root.ownerDocument.activeElement).toBe(box);
    root.querySelector<HTMLButtonElement>(".dd-save")!.click();
    await vi.waitFor(() => expect(writer.save).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 11.md`, "? Why does the wheel turn"));
  });

  it("redraws the lines when the session note changes, keeping the box as typed", () => {
    const { root, change, lineTexts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    const box = root.querySelector("textarea")!;
    box.value = "! Ride to Thessaly";
    change([sessionOf(11, ["? Who sent the letter", "?= Who sent the letter: Lady Vess"]), SESSIONS[1]!]);
    expect(lineTexts()).toEqual(["Who sent the letter", "Who sent the letter: Lady Vess"]);
    expect(root.querySelector(".dd-line-state")?.textContent).toBe("✓");
    expect(root.querySelector("textarea")).toBe(box);
    expect(box.value).toBe("! Ride to Thessaly");
  });

  it("moves to the latest session once the campaign is read, when none was asked for", () => {
    const { root, change, lineTexts } = pageWith([], null);
    expect(root.querySelector("textarea")).toBeNull();
    expect(root.querySelector(".dd-empty")?.textContent).toBe("No sessions yet. Start one to write in it.");
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session notes");
    change(SESSIONS);
    expect(root.querySelector("textarea")).not.toBeNull();
    expect(lineTexts()).toEqual(["Tracks lead to the [[Old Mill]].", "Find the caravan"]);
  });

  it("says to rename one when two sessions share the latest number, still listing them", () => {
    const shared = [sessionOf(4, []), sessionOf(4, [], "Session 04")];
    const { root, select } = pageWith(shared, null);
    expect(root.querySelector("textarea")).toBeNull();
    expect(root.querySelector(".dd-empty")?.textContent).toBe("Session notes share the latest number, so it isn't clear which is read last. Rename one.");
    expect(select().options).toHaveLength(2);
  });

  it("stops listening to the campaign when closed", () => {
    const { page, unsubscribe } = pageWith(SESSIONS, null);
    page.unload();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
