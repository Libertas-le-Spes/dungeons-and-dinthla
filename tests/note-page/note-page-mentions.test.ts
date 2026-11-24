import { describe, expect, it, vi } from "vitest";
import { NoteDrafts } from "../../src/note-editing/note-drafts";
import { NotePage } from "../../src/note-page/note-page";
import { NoteSaver } from "../../src/note-editing/note-saver";
import { Drafts } from "../../src/session-notes/drafts/drafts";
import { IN_THE_NOTES } from "../../src/characters/pages/mentions-panel";
import { obsidianDocument } from "../stubs/obsidian-dom";
import { FakeNotes } from "../note-editing/fake-notes";
import { fakeMentionNotes, NO_MENTIONS, type FakeMentionSetup } from "./fake-mention-notes";

const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const OTHER = "Fallen Star/Sessions/Session 3.md";

interface Opened {
  path: string;
  mentions: FakeMentionSetup;
}

const MILL_IN_TWO_SESSIONS: FakeMentionSetup = {
  ...NO_MENTIONS,
  links: { [OLD_MILL]: { [ONE]: [0], [TWO]: [1] } },
  texts: { [ONE]: "Tracks lead to the [[Old Mill]].", [TWO]: "Rain.\n@[[Old Mill]] ? Who lit the lamp" },
};

async function opened(given: Opened) {
  const shown = await open(given);
  await shown.page.mentionsSettled();
  return shown;
}

async function open({ path, mentions }: Opened) {
  const root = obsidianDocument().createElement("div");
  const notes = new FakeNotes(path, "The wheel turns at night.");
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const mentioned = fakeMentionNotes(mentions);
  const needs = {
    texts: notes.texts,
    drafts: new NoteDrafts(new Drafts({}, () => {})),
    saver: new NoteSaver(notes.store),
    actions,
    mentionNotes: mentioned.notes,
    isCampaignNote: () => true,
    openInEditor: vi.fn(),
  };
  const page = new NotePage(root, path, needs);
  page.load();
  await page.editingSettled();
  return { root, page, actions, stopped: mentioned.stopped };
}

function textsOf(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

describe("NotePage, In the notes", () => {
  it("lists every session line that links to a note in Places, newest session first, with its session and how many there are", async () => {
    const { root } = await opened({ path: OLD_MILL, mentions: MILL_IN_TWO_SESSIONS });
    expect(textsOf(root, ".dd-note-mentions .dd-title")).toEqual([`${IN_THE_NOTES}2 lines`]);
    expect(textsOf(root, ".dd-note-mentions .dd-row .dd-text")).toEqual(["@[[Old Mill]] ? Who lit the lamp", "Tracks lead to the [[Old Mill]]."]);
    expect(textsOf(root, ".dd-note-mentions .dd-row .dd-meta")).toEqual(["Session 2", "Session 1"]);
  });

  it("lists the lines for a place in a folder inside Places", async () => {
    const path = "Pale Moon/Places/Towns/Old Mill.md";
    const mentions = { ...NO_MENTIONS, links: { [path]: { [ONE]: [0] } }, texts: { [ONE]: "Tracks lead to the [[Old Mill]]." } };
    const { root } = await opened({ path, mentions });
    expect(textsOf(root, ".dd-note-mentions .dd-row .dd-text")).toEqual(["Tracks lead to the [[Old Mill]]."]);
  });

  it("lists lines from another campaign after the place's own campaign, with that campaign's name", async () => {
    const mentions = {
      ...MILL_IN_TWO_SESSIONS,
      campaignFolders: ["Pale Moon", "Fallen Star"],
      links: { [OLD_MILL]: { [ONE]: [0], [TWO]: [1], [OTHER]: [0] } },
      texts: { ...MILL_IN_TWO_SESSIONS.texts, [OTHER]: "[[Old Mill]] burned down." },
    };
    const { root } = await opened({ path: OLD_MILL, mentions });
    expect(textsOf(root, ".dd-note-mentions .dd-row .dd-meta")).toEqual(["Session 2", "Session 1", "Session 3 · Fallen Star"]);
  });

  it("opens a line's session at that line", async () => {
    const { root, actions } = await opened({ path: OLD_MILL, mentions: MILL_IN_TWO_SESSIONS });
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".dd-note-mentions .dd-row"));
    expect(rows).toHaveLength(2);
    rows.slice(1).forEach((row) => row.click());
    expect(actions.openRow).toHaveBeenCalledWith({ path: ONE, line: 0 });
  });

  it("says no session mentions the place yet, without a count", async () => {
    const { root } = await opened({ path: OLD_MILL, mentions: NO_MENTIONS });
    expect(textsOf(root, ".dd-note-mentions .dd-empty")).toEqual(["No session mentions [[Old Mill]] yet."]);
    expect(root.querySelector(".dd-note-mentions .dd-count")).toBeNull();
  });

  it("shows nothing on a note that is not in Places", async () => {
    const mentions = { ...MILL_IN_TWO_SESSIONS, links: { "Pale Moon/Old Mill.md": { [ONE]: [0] } } };
    const { root } = await opened({ path: "Pale Moon/Old Mill.md", mentions });
    expect(root.querySelector(".dd-note-mentions")).toBeNull();
    expect(root.textContent).not.toContain(IN_THE_NOTES);
  });

  it("shows nothing on a note in Characters", async () => {
    const { root } = await opened({ path: "Pale Moon/Characters/Mira.md", mentions: NO_MENTIONS });
    expect(root.querySelector(".dd-note-mentions")).toBeNull();
  });

  it("shows nothing on a note in a Places folder outside every campaign", async () => {
    const { root } = await opened({ path: OLD_MILL, mentions: { ...NO_MENTIONS, campaignFolders: ["Fallen Star"] } });
    expect(root.querySelector(".dd-note-mentions")).toBeNull();
  });

  it("shows nothing when Obsidian has no file for the note", async () => {
    const { root } = await opened({ path: OLD_MILL, mentions: { ...MILL_IN_TWO_SESSIONS, fileExists: false } });
    expect(root.querySelector(".dd-note-mentions")).toBeNull();
  });

  it("is not settled until the lines being read are drawn", async () => {
    let release: () => void = () => {};
    const readyToRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { root, page } = await open({ path: OLD_MILL, mentions: { ...MILL_IN_TWO_SESSIONS, readyToRead } });
    let done = false;
    const settled = page.mentionsSettled().then(() => {
      done = true;
    });
    await page.editingSettled();
    expect(done).toBe(false);
    expect(textsOf(root, ".dd-note-mentions .dd-row")).toEqual([]);
    release();
    await settled;
    expect(done).toBe(true);
    expect(textsOf(root, ".dd-note-mentions .dd-row .dd-meta")).toEqual(["Session 2", "Session 1"]);
  });

  it("draws nothing if the page is closed while the lines are still being read", async () => {
    let release: () => void = () => {};
    const readyToRead = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { root, page } = await open({ path: OLD_MILL, mentions: { ...MILL_IN_TWO_SESSIONS, readyToRead } });
    page.unload();
    release();
    await page.mentionsSettled();
    expect(root.querySelector(".dd-note-mentions .dd-title")).toBeNull();
  });

  it("stops watching the links when the page is closed", async () => {
    const { page, stopped } = await opened({ path: OLD_MILL, mentions: MILL_IN_TWO_SESSIONS });
    expect(stopped).toEqual([]);
    page.unload();
    expect(stopped.sort()).toEqual(["moved", "resolved"]);
  });
});
