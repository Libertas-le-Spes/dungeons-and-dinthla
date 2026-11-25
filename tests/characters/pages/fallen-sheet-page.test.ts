import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { FallenSheetPage, type FallenNeeds } from "../../../src/characters/pages/fallen-sheet-page";
import { NO_LEFT_PLAY } from "../../../src/characters/pages/left-play-section";
import type { SheetNotes } from "../../../src/characters/reading/sheet-notes";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";

const BRANN = { path: "Pale Moon/Fallen/Brann.md", basename: "Brann" } as TFile;
const ONE = "Pale Moon/Sessions/Session 1.md";

const SNAPSHOT = [
  "---",
  "standing: departed",
  'departure: "Joined the Silver Order"',
  "---",
  "Met at the ford.",
  "",
  "## Left play on 2026-11-12",
  "Joined the Silver Order on 2026-11-12, after [[Session 7]].",
  "Last doing: holding the bridge\\: alone",
  "### Open questions",
  "- Who sent the letter",
  "- Is \\[\\[Vess\\]\\] lying",
  "",
].join("\n");

class Watchers {
  changed: (path: string) => void = () => {};
  moved: (path: string) => void = () => {};
  store: () => void = () => {};
}

interface Setup {
  text?: string;
  session?: string;
  textOf?: SheetNotes["textOf"];
}

function openFallen({ text = SNAPSHOT, session = "", textOf }: Setup = {}) {
  const watchers = new Watchers();
  const reads = { count: 0 };
  let readText: SheetNotes["textOf"] = async () => text;
  if (textOf !== undefined) readText = textOf;
  const notes: SheetNotes = {
    holds: () => true,
    textOf: (file) => {
      reads.count += 1;
      return readText(file);
    },
    pathOfLink: () => BRANN.path,
    isOwnCharacter: () => false,
    campaignFolders: () => ["Pale Moon"],
    filesIn: () => [],
    sessionsOf: async () => [],
    onNoteChanged: (changed) => {
      watchers.changed = changed;
      return () => {};
    },
    fileAt: () => BRANN,
    carriedFromOf: () => null,
    onNoteMoved: (moved) => {
      watchers.moved = moved;
      return () => {};
    },
  };
  const store = {
    campaignFolder: "Pale Moon",
    sessionNotes: [{ path: ONE, number: 1, firstLine: 0, text: session }] as SessionNote[],
    subscribe: (next: () => void) => {
      watchers.store = next;
      return () => {};
    },
  };
  const needs: FallenNeeds = {
    store,
    notes,
    links: { openLink: vi.fn() },
    makeMain: { makeMain: vi.fn() },
    leave: vi.fn(),
  };
  const root = obsidianDocument().createElement("div");
  root.ownerDocument.body.append(root);
  const page = new FallenSheetPage(BRANN, needs, STUB_SYNTAX);
  const start = () => {
    mountTree(page.tree(), root);
    page.started();
  };
  return { page, root, needs, watchers, reads, start };
}

async function loaded(setup: Setup = {}) {
  const fallen = openFallen(setup);
  fallen.start();
  await fallen.page.rendered();
  return fallen;
}

function textsOf(root: HTMLElement, selector: string): string[] {
  const texts: string[] = [];
  for (const element of root.querySelectorAll(selector)) texts.push(element.textContent);
  return texts;
}

function buttonWordsOf(root: HTMLElement): string[] {
  return textsOf(root, "button");
}

describe("a fallen character's page", () => {
  it("shows their name with Make main as its only button", async () => {
    const { root } = await loaded();
    expect(textsOf(root, ".dd-sheet-name")).toEqual(["Brann"]);
    expect(buttonWordsOf(root)).toEqual(["Make main"]);
  });

  it("makes them main from the page when Make main is pressed", async () => {
    const { root, needs } = await loaded();
    root.querySelector<HTMLButtonElement>(".dd-make-main")!.click();
    expect(needs.makeMain.makeMain).toHaveBeenCalledOnce();
    expect(vi.mocked(needs.makeMain.makeMain).mock.calls[0]![0]).toBe(BRANN.path);
  });

  it("shows the class line and the six scores, with their modifiers, as text that cannot be tapped", async () => {
    const { root } = await loaded({ session: "[[Brann]] subtitle: Human Fighter 5, STR: 16, CHA: 8" });
    expect(textsOf(root, ".dd-sheet-subtitle")).toEqual(["Human Fighter 5"]);
    expect(textsOf(root, ".dd-sheet-ability b")).toEqual(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
    expect(textsOf(root, ".dd-sheet-ability .dd-value-read")).toEqual(["16", "?", "?", "?", "?", "8"]);
    expect(textsOf(root, ".dd-sheet-ability .dd-modifier")).toEqual(["(+3)", "(\u22121)"]);
    expect(root.querySelector(".dd-value, .dd-sheet-rows, .dd-sheet-stat-block, .dd-sheet-mentions, .dd-sheet-depart")).toBeNull();
  });

  it("leaves the class line out while it isn't known", async () => {
    const { root } = await loaded({ session: "[[Brann]] STR: 16" });
    expect(root.querySelector(".dd-sheet-subtitle")).toBeNull();
  });

  it("shows what happened to them from the snapshot down, without the words above it", async () => {
    const { root } = await loaded();
    expect(textsOf(root, ".dd-left-play-heading")).toEqual(["Left play on 2026-11-12"]);
    expect(textsOf(root, ".dd-left-play-line")).toEqual(["Joined the Silver Order on 2026-11-12, after [[Session 7]].", "Last doing: holding the bridge: alone"]);
    expect(textsOf(root, ".dd-left-play-list")).toEqual(["Open questions"]);
    expect(textsOf(root, ".dd-left-play-entry")).toEqual(["Who sent the letter", "Is [[Vess]] lying"]);
    expect(root.querySelector(".dd-left-play")!.textContent).not.toContain("Met at the ford.");
  });

  it("opens the session a snapshot links to, and nothing for words that were kept from being a link", async () => {
    const { root, needs } = await loaded();
    const links = root.querySelectorAll<HTMLElement>(".dd-left-play .dd-link-name");
    expect(links).toHaveLength(1);
    links[0]!.click();
    expect(needs.links.openLink).toHaveBeenCalledExactlyOnceWith("Session 7", BRANN.path, false);
  });

  it("shows every snapshot when they left play more than once", async () => {
    const second = `${SNAPSHOT}\n## Left play on 2026-12-01\nDied on 2026-12-01.\n`;
    const { root } = await loaded({ text: second });
    expect(textsOf(root, ".dd-left-play-heading")).toEqual(["Left play on 2026-11-12", "Left play on 2026-12-01"]);
  });

  it("says nothing is written about how they left play when their note has no snapshot", async () => {
    const { root } = await loaded({ text: "---\nstanding: died\n---\nMoved by hand.\n" });
    expect(textsOf(root, ".dd-left-play .dd-empty")).toEqual([NO_LEFT_PLAY]);
  });

  it("says the note couldn't be read, keeping their name and Make main", async () => {
    const { root } = await loaded({ textOf: () => Promise.reject(new Error("Locked.")) });
    expect(textsOf(root, ".dd-sheet-name")).toEqual(["Brann"]);
    expect(buttonWordsOf(root)).toEqual(["Make main"]);
    expect(textsOf(root, ".dd-empty")).toEqual(["Couldn't read Brann's sheet: Locked."]);
  });
});

describe("a fallen character's page as their note changes", () => {
  it("draws again when their note changes, and not for another note", async () => {
    const { page, root, watchers, reads } = await loaded();
    const before = reads.count;
    watchers.changed("Pale Moon/Characters/Mira.md");
    await page.rendered();
    expect(reads.count).toBe(before);
    watchers.changed(BRANN.path);
    await page.rendered();
    expect(reads.count).toBeGreaterThan(before);
    expect(textsOf(root, ".dd-sheet-name")).toEqual(["Brann"]);
  });

  it("leaves for the page their note now belongs on when it moves or goes, and stays for another note", async () => {
    const { needs, watchers } = await loaded();
    watchers.moved("Pale Moon/Fallen/Mira.md");
    expect(needs.leave).not.toHaveBeenCalled();
    watchers.moved(BRANN.path);
    expect(needs.leave).toHaveBeenCalledOnce();
  });

  it("empties the page when it closes", async () => {
    const { page, root } = await loaded();
    page.stopped();
    expect(root.firstElementChild!.childElementCount).toBe(0);
  });
});
