import { afterEach, describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { CharacterSheetPage, couldNotRead, TAP_A_VALUE, type SheetActions } from "../../../src/characters/pages/character-sheet-page";
import type { SheetValue } from "../../../src/characters/reading/character-sheet";
import type { CarriedFrom, SheetNotes } from "../../../src/characters/reading/sheet-notes";
import type { MentionNotes } from "../../../src/characters/reading/mention-notes";
import { IN_THE_NOTES } from "../../../src/characters/pages/mentions-panel";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { HeldCalls } from "../../stubs/held-calls";
import { queuedWorkRan } from "../../stubs/queued-work";
import { SettleWatch } from "../../stubs/settle-watch";
import { RecordingTracking } from "../imported/builders/recording-tracking";

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const OLD_MIRA = "Ashen Road/Characters/Mira.md";
const ONE = "Pale Moon/Sessions/Session 1.md";

class HeldMiraReads {
  constructor(private readonly reads: HeldCalls<string>) {}

  textOf(file: TFile): Promise<string> {
    if (file.path !== MIRA.path) return Promise.resolve("");
    return this.reads.hold();
  }
}

function miraReadFrom(reads: HeldCalls<string>): SheetNotes["textOf"] {
  const held = new HeldMiraReads(reads);
  return held.textOf.bind(held);
}

interface Setup {
  sessions?: string[];
  texts?: Record<string, string>;
  carriedFrom?: CarriedFrom | null;
  textOf?: SheetNotes["textOf"];
  linking?: Record<string, number[]>;
  mentionTextOf?: MentionNotes["textOf"];
}

function openSheet({ sessions = [], texts = {}, carriedFrom = null, textOf, linking = {}, mentionTextOf }: Setup = {}) {
  let listener = () => {};
  let noteChanged: (path: string) => void = () => {};
  let noteMoved: (path: string) => void = () => {};
  const store = {
    campaignFolder: "Pale Moon",
    sessionNotes: [{ path: ONE, number: 1, firstLine: 0, text: sessions.join("\n") }] as SessionNote[],
    subscribe: (next: () => void) => {
      listener = next;
      return () => {};
    },
  };
  const reads = { count: 0 };
  let readText: SheetNotes["textOf"] = async (file) => {
    const text = texts[file.path];
    if (text === undefined) return "";
    return text;
  };
  if (textOf !== undefined) readText = textOf;
  const notes: SheetNotes = {
    holds: () => true,
    textOf: (file) => {
      reads.count += 1;
      return readText(file);
    },
    pathOfLink: (linktext, sourcePath) => `${sourcePath.slice(0, sourcePath.indexOf("/"))}/Characters/${linktext}.md`,
    isOwnCharacter: () => false,
    campaignFolders: () => ["Ashen Road", "Pale Moon"],
    filesIn: () => [],
    sessionsOf: async () => [],
    onNoteChanged: (changed) => {
      noteChanged = changed;
      return () => {};
    },
    fileAt: (path) => fileAt(path),
    carriedFromOf: () => carriedFrom,
    onNoteMoved: (moved) => {
      noteMoved = moved;
      return () => {};
    },
  };
  let linksResolved: (path: string) => void = () => {};
  const mentionReads = { count: 0 };
  let readMention: MentionNotes["textOf"] = async (file) => {
    const text = texts[file.path];
    if (text === undefined) return "";
    return text;
  };
  if (mentionTextOf !== undefined) readMention = mentionTextOf;
  const mentionNotes: MentionNotes = {
    fileAt: (path) => fileAt(path),
    textOf: (file) => {
      mentionReads.count += 1;
      return readMention(file);
    },
    campaignFolders: () => ["Ashen Road", "Pale Moon"],
    onNoteMoved: () => () => {},
    linkingPaths: () => Object.keys(linking),
    linkedLines: (sourcePath) => {
      const lines = linking[sourcePath];
      if (lines === undefined) return [];
      return lines;
    },
    onLinksResolved: (resolved) => {
      linksResolved = resolved;
      return () => {};
    },
  };
  const closers: (() => void)[] = [];
  const chosen: SheetValue[] = [];
  const actions: SheetActions = {
    openRow: vi.fn(),
    openLink: vi.fn(),
    editCharacter: vi.fn(),
    updateFromBeyond: vi.fn(),
    tracking: new RecordingTracking(null),
    chooseValue: (_file, value, onClosed) => {
      chosen.push(value);
      closers.push(onClosed);
    },
  };
  const root = obsidianDocument().createElement("div");
  root.ownerDocument.body.append(root);
  const pages: CharacterSheetPage[] = [];
  const start = (file = MIRA) => {
    const page = new CharacterSheetPage(root, file, store, notes, actions, mentionNotes);
    pages.push(page);
    page.load();
    return page;
  };
  async function rendered(): Promise<void> {
    for (const page of pages) await page.rendered();
  }
  const load = async (file = MIRA) => {
    const page = start(file);
    await page.rendered();
    return page;
  };
  const button = (name: string) => root.querySelector<HTMLButtonElement>(`.dd-value[data-name="${name}"]`)!;
  const rowOf = (label: string) =>
    Array.from(root.querySelectorAll(".dd-sheet-row")).find((row) => row.querySelector(".dd-sheet-label")!.textContent === label)!;
  return {
    root,
    start,
    store,
    reads,
    mentionReads,
    actions,
    chosen,
    closers,
    load,
    rendered,
    button,
    rowOf,
    listener: () => listener(),
    noteChanged: (path: string) => noteChanged(path),
    noteMoved: (path: string) => noteMoved(path),
    linksResolved: (path: string) => linksResolved(path),
  };
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function textsOf(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CharacterSheetPage", () => {
  it("shows the name, the subtitle and every value, with ? for what isn't known", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] subtitle: Half-elf Ranger 5, AC: 15"] });
    await sheet.load();
    expect(textsOf(sheet.root, ".dd-sheet-name")).toEqual(["Mira"]);
    expect(textsOf(sheet.root, ".dd-sheet-subtitle")).toEqual(["Half-elf Ranger 5"]);
    expect(textsOf(sheet.root, ".dd-sheet-ability b")).toEqual(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
    expect(textsOf(sheet.root, ".dd-sheet-label")).toEqual(["Type line", "Subtitle", "Class", "Armor Class", "Hit Points", "Speed", "Alignment"]);
    expect(sheet.button("AC").textContent).toBe("15");
    expect(sheet.button("HP").textContent).toBe("?");
    expect(textsOf(sheet.root, ".dd-sheet-hint")).toEqual([TAP_A_VALUE]);
  });

  it("leaves the subtitle line out while the subtitle isn't known", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] subtitle: ?"] });
    await sheet.load();
    expect(sheet.root.querySelector(".dd-sheet-subtitle")).toBeNull();
  });

  it("shows each ability score with its modifier, but none for a score not known or for other values", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] DEX: 17, STR: 8, CON: ?, AC: 15"] });
    await sheet.load();
    expect(textsOf(sheet.root, ".dd-sheet-ability .dd-modifier")).toEqual(["(−1)", "(+3)"]);
    expect(sheet.root.querySelector(".dd-sheet-row .dd-modifier")).toBeNull();
  });

  it("marks each value with its state, in words for those who can't see the colour", async () => {
    const sheet = openSheet({
      sessions: ["[[Mira]] AC: 15, HP: 30, speed: ?"],
      texts: { [MIRA.path]: "HP: 44", [OLD_MIRA]: "class: Ranger" },
      carriedFrom: { path: OLD_MIRA, groups: ["values"] },
    });
    await sheet.load();
    expect(sheet.button("AC").className).toBe("dd-value dd-state-learned");
    expect(sheet.button("HP").className).toBe("dd-value dd-state-override");
    expect(sheet.button("class").className).toBe("dd-value dd-state-carried");
    expect(sheet.button("speed").className).toBe("dd-value dd-state-unknown");
    expect(sheet.button("alignment").className).toBe("dd-value dd-state-unknown");
    expect(sheet.button("HP").getAttribute("aria-label")).toBe("Hit Points: 44, Override");
    expect(sheet.button("alignment").getAttribute("aria-label")).toBe("Alignment: ?, Not known yet");
  });

  it("names where each value came from: its session, an override or the campaign it was carried from", async () => {
    const sheet = openSheet({
      sessions: ["[[Mira]] AC: 15"],
      texts: { [MIRA.path]: "HP: 44", [OLD_MIRA]: "class: Ranger" },
      carriedFrom: { path: OLD_MIRA, groups: ["values"] },
    });
    await sheet.load();
    expect(textsOf(sheet.rowOf("Armor Class"), ".dd-value-source")).toEqual(["Session 1"]);
    expect(textsOf(sheet.rowOf("Hit Points"), ".dd-value-source")).toEqual(["Override"]);
    expect(textsOf(sheet.rowOf("Class"), ".dd-value-source")).toEqual(["Carried from Ashen Road"]);
    expect(textsOf(sheet.rowOf("Speed"), ".dd-value-source")).toEqual(["Not known yet"]);
    expect(sheet.rowOf("Speed").querySelector(".dd-source-link")).toBeNull();
  });

  it("opens the line a value came from", async () => {
    const sheet = openSheet({ sessions: ["Notes", "[[Mira]] AC: 15"] });
    await sheet.load();
    sheet.rowOf("Armor Class").querySelector<HTMLElement>(".dd-source-link")!.click();
    expect(sheet.actions.openRow).toHaveBeenCalledWith({ path: ONE, line: 1 });
  });

  it("counts a value's earlier lines", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] HP: 31", "[[Mira]] HP: 34", "[[Mira]] HP: 38"] });
    await sheet.load();
    const earlier = sheet.rowOf("Hit Points").querySelector(".dd-earlier")!;
    expect(earlier.textContent).toBe("↺ 2");
    expect(earlier.getAttribute("aria-label")).toBe("2 earlier values");
    expect(sheet.rowOf("Armor Class").querySelector(".dd-earlier")).toBeNull();
  });

  it("adds the other values after the sheet's own", async () => {
    const sheet = openSheet({ texts: { [MIRA.path]: "Patron: Lady Vess" } });
    await sheet.load();
    expect(textsOf(sheet.root, ".dd-sheet-label").slice(7)).toEqual(["Patron"]);
  });

  it("opens the value's dialog on a tap, then puts focus back on the value", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] AC: 15"] });
    await sheet.load();
    sheet.button("AC").click();
    expect(sheet.chosen.map(({ name, state }) => [name, state])).toEqual([["AC", "learned"]]);
    sheet.closers[0]!();
    expect(sheet.root.ownerDocument.activeElement).toBe(sheet.button("AC"));
  });

  it("puts focus back on the value after the sheet is drawn again", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] AC: 15"] });
    await sheet.load();
    sheet.button("AC").click();
    sheet.closers[0]!();
    sheet.button("HP").focus();
    sheet.listener();
    await sheet.rendered();
    expect(sheet.root.ownerDocument.activeElement).toBe(sheet.button("AC"));
  });

  it("stops putting focus back once a moment has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const sheet = openSheet({ sessions: ["[[Mira]] AC: 15"] });
    await sheet.load();
    sheet.button("AC").click();
    sheet.closers[0]!();
    sheet.button("HP").focus();
    vi.setSystemTime(Date.now() + 5000);
    const reads = sheet.reads.count;
    sheet.listener();
    await sheet.rendered();
    expect(sheet.reads.count).toBe(reads + 1);
    expect(sheet.button("HP")).not.toBeNull();
    expect(sheet.root.ownerDocument.activeElement).not.toBe(sheet.button("AC"));
  });

  it("shows a stat block built from the sheet's values, with ? for what isn't known", async () => {
    const sheet = openSheet({
      sessions: ["[[Mira]] type: Medium humanoid (half-elf), chaotic good, AC: 15, DEX: 17, HP: 30, speed: ?"],
      texts: { [MIRA.path]: "HP: 44", [OLD_MIRA]: "class: Ranger, STR: 13" },
      carriedFrom: { path: OLD_MIRA, groups: ["abilities", "values"] },
    });
    await sheet.load();
    const block = sheet.root.querySelector<HTMLElement>(".dd-sheet-stat-block")!;
    expect(textsOf(block, ".dd-title")).toEqual(["Stat block"]);
    expect(block.querySelectorAll(":scope > .dd-stat-block")).toHaveLength(1);
    expect(textsOf(block, ".dd-stat-block-name")).toEqual(["Mira"]);
    expect(textsOf(block, ".dd-stat-block-type")).toEqual(["Medium humanoid (half-elf), chaotic good"]);
    expect(textsOf(block, ".dd-stat-block-line")).toEqual(["Class Ranger", "Armor Class 15", "Hit Points 44", "Speed ?"]);
    expect(textsOf(block, ".dd-stat-block-abilities > div")).toEqual(["STR13 (+1)", "DEX17 (+3)", "CON?", "INT?", "WIS?", "CHA?"]);
    expect(textsOf(block, ".dd-unknown")).toEqual(["?", "?", "?", "?", "?"]);
  });

  it("opens the character dialog from Edit character", async () => {
    const sheet = openSheet();
    await sheet.load();
    sheet.root.querySelector<HTMLElement>(".dd-create")!.click();
    expect(sheet.actions.editCharacter).toHaveBeenCalledWith(MIRA);
  });

  it("draws again when the campaign's sessions change", async () => {
    const sheet = openSheet();
    await sheet.load();
    sheet.store.sessionNotes = [{ path: ONE, number: 1, firstLine: 0, text: "[[Mira]] AC: 15" }];
    sheet.listener();
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("15");
  });

  it("draws again when the character's note or a note in its campaign or the carried campaign changes, and not otherwise", async () => {
    const sheet = openSheet({ carriedFrom: { path: OLD_MIRA, groups: ["values"] } });
    await sheet.load();
    const before = sheet.reads.count;
    sheet.noteChanged("Elsewhere/Note.md");
    sheet.noteChanged("Pale Moonlight/Note.md");
    sheet.noteChanged("Ashen Roads/Note.md");
    expect(sheet.reads.count).toBe(before);
    sheet.noteChanged(MIRA.path);
    sheet.noteChanged("Pale Moon/Sessions/Session 2.md");
    sheet.noteChanged("Ashen Road/Sessions/Session 4.md");
    await sheet.rendered();
    expect(sheet.reads.count).toBe(before + 6);
  });

  it("draws again when a carried note outside any campaign changes", async () => {
    const sheet = openSheet({ carriedFrom: { path: "Library/Mira.md", groups: ["values"] } });
    await sheet.load();
    const before = sheet.reads.count;
    sheet.noteChanged("Library/Other.md");
    expect(sheet.reads.count).toBe(before);
    sheet.noteChanged("Library/Mira.md");
    await sheet.rendered();
    expect(sheet.reads.count).toBe(before + 2);
  });

  it("draws again when a session note is deleted or renamed, and not for notes elsewhere", async () => {
    const sheet = openSheet();
    await sheet.load();
    const before = sheet.reads.count;
    sheet.noteMoved("Elsewhere/Note.md");
    expect(sheet.reads.count).toBe(before);
    sheet.noteMoved("Pale Moon/Sessions/Session 2.md");
    await sheet.rendered();
    expect(sheet.reads.count).toBe(before + 1);
  });

  it("says so when the sheet can't be read", async () => {
    const sheet = openSheet({ textOf: async () => {
      throw new Error("the disk is gone");
    } });
    await sheet.load();
    expect(textsOf(sheet.root, ".dd-empty")).toEqual([couldNotRead(MIRA, new Error("the disk is gone"))]);
    expect(textsOf(sheet.root, ".dd-empty")).toEqual(["Couldn't read Mira's sheet: the disk is gone"]);
    expect(sheet.root.querySelector(".dd-value")).toBeNull();
  });

  function failingFirst(setup: Setup = {}) {
    const reading = { fails: true };
    const sheet = openSheet({ ...setup, textOf: async () => {
      if (reading.fails) throw new Error("the disk is gone");
      return "AC: 16";
    } });
    return { sheet, reading };
  }

  it("recovers from a failed first reading when the character's note changes", async () => {
    const { sheet, reading } = failingFirst();
    await sheet.load();
    reading.fails = false;
    sheet.noteChanged("Elsewhere/Note.md");
    expect(sheet.root.querySelector(".dd-value")).toBeNull();
    sheet.noteChanged(MIRA.path);
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("recovers from a failed first reading when a session changes", async () => {
    const { sheet, reading } = failingFirst();
    await sheet.load();
    reading.fails = false;
    sheet.noteChanged("Pale Moon/Sessions/Session 2.md");
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("recovers from a failed first reading when a session is moved", async () => {
    const { sheet, reading } = failingFirst();
    await sheet.load();
    reading.fails = false;
    sheet.noteMoved("Pale Moon/Sessions/Session 2.md");
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("keeps watching the carried note when a later reading fails", async () => {
    const reading = { fails: false };
    const sheet = openSheet({
      carriedFrom: { path: "Library/Mira.md", groups: ["values"] },
      textOf: async () => {
        if (reading.fails) throw new Error("the disk is gone");
        return "AC: 16";
      },
    });
    await sheet.load();
    reading.fails = true;
    sheet.noteChanged(MIRA.path);
    await sheet.rendered();
    expect(sheet.root.querySelector(".dd-empty")).not.toBeNull();
    reading.fails = false;
    sheet.noteChanged("Library/Mira.md");
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("watches nothing outside a campaign but the note itself after a failed reading", async () => {
    const reading = { fails: true };
    const sheet = openSheet({ textOf: async () => {
      if (reading.fails) throw new Error("the disk is gone");
      return "AC: 16";
    } });
    await sheet.load(fileAt("Loose/Mira.md"));
    reading.fails = false;
    sheet.noteChanged("Loose/Other.md");
    expect(sheet.root.querySelector(".dd-value")).toBeNull();
    sheet.noteChanged("Loose/Mira.md");
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("keeps the latest sheet when an earlier reading fails late", async () => {
    const reads = new HeldCalls<string>();
    const sheet = openSheet({ textOf: miraReadFrom(reads) });
    sheet.start();
    await reads.made(1);
    sheet.listener();
    await reads.made(2);
    reads.resolve(1, "AC: 16");
    await settle();
    reads.reject(0, new Error("the disk is gone"));
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
    expect(sheet.root.querySelector(":scope > .dd-empty")).toBeNull();
  });

  it("draws only the latest reading when readings finish out of order", async () => {
    const reads = new HeldCalls<string>();
    const sheet = openSheet({ textOf: miraReadFrom(reads) });
    sheet.start();
    sheet.listener();
    await reads.made(2);
    reads.resolve(1, "AC: 16");
    await settle();
    reads.resolve(0, "AC: 9");
    await sheet.rendered();
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("empties the sheet when it is closed, dropping a reading still on its way", async () => {
    const reads = new HeldCalls<string>();
    const sheet = openSheet({ textOf: miraReadFrom(reads) });
    const page = sheet.start();
    await reads.made(1);
    page.unload();
    reads.resolve(0, "AC: 16");
    await sheet.rendered();
    expect(sheet.root.childElementCount).toBe(0);
  });

  it("empties the sheet when it is closed", async () => {
    const sheet = openSheet();
    const page = await sheet.load();
    page.unload();
    expect(sheet.root.childElementCount).toBe(0);
  });

  it("lists the session lines that link to the character after the stat block", async () => {
    const sheet = openSheet({ linking: { [ONE]: [0] }, texts: { [ONE]: "- Met [[Mira]] at the ford" } });
    await sheet.load();
    await sheet.rendered();
    expect(textsOf(sheet.root, ".dd-sheet-mentions .dd-text")).toEqual(["Met [[Mira]] at the ford"]);
    expect(textsOf(sheet.root, ".dd-sheet-mentions .dd-title")).toEqual([`${IN_THE_NOTES}1 line`]);
    expect(sheet.root.lastElementChild!.classList.contains("dd-sheet-mentions")).toBe(true);
    expect(sheet.root.lastElementChild!.previousElementSibling!.classList.contains("dd-sheet-stat-block")).toBe(true);
  });

  it("isn't rendered while the lines that link to the character are still being read", async () => {
    const mentionTexts = new HeldCalls<string>();
    const sheet = openSheet({ linking: { [ONE]: [0] }, mentionTextOf: mentionTexts.hold.bind(mentionTexts) });
    const loading = new SettleWatch(sheet.load());
    await mentionTexts.made(1);
    await queuedWorkRan();
    expect(loading.settled).toBe(false);
    mentionTexts.resolve(0, "- Met [[Mira]] at the ford");
    await loading.done;
    expect(textsOf(sheet.root, ".dd-sheet-mentions .dd-title")).toEqual([`${IN_THE_NOTES}1 line`]);
  });

  it("lists the lines again when a note that links to the character is resolved", async () => {
    const sheet = openSheet({ linking: { [ONE]: [0] }, texts: { [ONE]: "[[Mira]]" } });
    await sheet.load();
    await sheet.rendered();
    expect(sheet.mentionReads.count).toBe(1);
    sheet.linksResolved(ONE);
    await sheet.rendered();
    expect(sheet.mentionReads.count).toBe(2);
  });

  it("keeps the lines it has when the rest of the sheet is drawn again", async () => {
    const sheet = openSheet({ linking: { [ONE]: [0] }, texts: { [ONE]: "[[Mira]]" } });
    await sheet.load();
    await sheet.rendered();
    expect(sheet.mentionReads.count).toBe(1);
    const before = sheet.reads.count;
    sheet.listener();
    await sheet.rendered();
    expect(sheet.reads.count).toBeGreaterThan(before);
    expect(textsOf(sheet.root, ".dd-sheet-mentions .dd-text")).toEqual(["[[Mira]]"]);
    expect(sheet.mentionReads.count).toBe(1);
  });

  it("stops listing the lines once it is closed", async () => {
    const sheet = openSheet({ linking: { [ONE]: [0] }, texts: { [ONE]: "[[Mira]]" } });
    const page = await sheet.load();
    await sheet.rendered();
    expect(sheet.mentionReads.count).toBe(1);
    page.unload();
    sheet.linksResolved(ONE);
    expect(sheet.mentionReads.count).toBe(1);
  });

  it("stops listing the lines when the sheet can't be read", async () => {
    const { sheet, reading } = failingFirst({ linking: { [ONE]: [0] } });
    reading.fails = false;
    await sheet.load();
    await sheet.rendered();
    expect(sheet.mentionReads.count).toBe(1);
    reading.fails = true;
    sheet.listener();
    await sheet.rendered();
    expect(sheet.root.querySelector(".dd-value")).toBeNull();
    sheet.linksResolved(ONE);
    expect(sheet.mentionReads.count).toBe(1);
  });

  it("draws the new name when its note is renamed, as Obsidian renames the same file", async () => {
    const sheet = openSheet();
    const mira = fileAt(MIRA.path);
    await sheet.load(mira);
    Object.assign(mira, fileAt("Pale Moon/Characters/Mirabel.md"));
    sheet.noteMoved(MIRA.path);
    await sheet.rendered();
    expect(textsOf(sheet.root, ".dd-sheet-name")).toEqual(["Mirabel"]);
  });
});

function textIn(parent: Element, selector: string): string | null {
  const found = parent.querySelector(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}.`);
  return found.textContent;
}

function buttonsSaying(root: HTMLElement, words: string): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
    if (button.textContent === words) found.push(button);
  }
  return found;
}

function buttonWords(root: HTMLElement): (string | null)[] {
  const words: (string | null)[] = [];
  for (const button of root.querySelectorAll("button")) words.push(button.textContent);
  return words;
}

const IMPORTED = [
  "---",
  "imported-from: online",
  "AC: 16",
  "HP: 14",
  "---",
  "## Numbers (from D&D Beyond)",
  "- AC · 16 · 10 + DEX 4 + WIS 2 · Worked out here",
  "- HP · 14 · Worked out here",
  "",
].join("\n");

describe("CharacterSheetPage for an imported character", () => {
  it("shows the route under an imported value, and its working when it has one", async () => {
    const { load, rowOf } = openSheet({ texts: { [MIRA.path]: IMPORTED } });
    await load();
    const armour = rowOf("Armor Class");
    expect(textIn(armour, ".dd-value")).toBe("16");
    expect(textIn(armour, ".dd-value-source")).toBe("From D&D Beyond");
    expect(textIn(armour, ".dd-value-working")).toBe("10 + DEX 4 + WIS 2");
    expect(textIn(armour, ".dd-value-route")).toBe("Worked out here, from D&D Beyond (online)");
    expect(rowOf("Hit Points").querySelector(".dd-value-working")).toBeNull();
  });

  it("gives an imported value the imported look", async () => {
    const { load, rowOf } = openSheet({ texts: { [MIRA.path]: IMPORTED } });
    await load();
    expect(rowOf("Armor Class").querySelector(".dd-value.dd-state-imported")).not.toBeNull();
  });

  it("shows no route under a value his own note overrides", async () => {
    const { load, rowOf } = openSheet({ texts: { [MIRA.path]: IMPORTED.replace("## Numbers", "AC: 18\n## Numbers") } });
    await load();
    expect(textIn(rowOf("Armor Class"), ".dd-value")).toBe("18");
    expect(rowOf("Armor Class").querySelector(".dd-value-route")).toBeNull();
  });

  it("offers Update from D&D Beyond, which asks once for this character's update", async () => {
    const { load, root, actions } = openSheet({ texts: { [MIRA.path]: IMPORTED } });
    await load();
    const buttons = buttonsSaying(root, "Update from D&D Beyond");
    expect(buttons).toHaveLength(1);
    for (const button of buttons) button.click();
    expect(actions.updateFromBeyond).toHaveBeenCalledOnce();
    const [[asked, returnFocus]] = vi.mocked(actions.updateFromBeyond).mock.calls as [[TFile, () => void]];
    expect(asked).toBe(MIRA);
    returnFocus();
    expect(buttons).toContain(root.ownerDocument.activeElement);
  });

  it("offers Update from D&D Beyond on a Characters note nothing was imported into", async () => {
    const { load, root, actions } = openSheet({ texts: { [MIRA.path]: "AC: 16\n" } });
    await load();
    const buttons = buttonsSaying(root, "Update from D&D Beyond");
    expect(buttons).toHaveLength(1);
    for (const button of buttons) button.click();
    const [[asked]] = vi.mocked(actions.updateFromBeyond).mock.calls as [[TFile, () => void]];
    expect(asked).toBe(MIRA);
  });

  it("offers no update on a sheet whose note the import couldn't write: Fallen, deeper than Characters, or in no campaign", async () => {
    const paths = ["Pale Moon/Fallen/Thessaly.md", "Pale Moon/Characters/Old/Mira.md", "Notes/Mira.md"];
    for (const path of paths) {
      const { load, root } = openSheet();
      await load(fileAt(path));
      expect(buttonWords(root), path).not.toContain("Update from D&D Beyond");
      expect(buttonWords(root), path).toContain("Edit character");
    }
  });

  it("puts its buttons together in one row of actions beside the name", async () => {
    const { load, root } = openSheet({ texts: { [MIRA.path]: IMPORTED } });
    await load();
    const actions = root.querySelector(".dd-head .dd-head-actions");
    if (actions === null) throw new Error("The head has no actions row.");
    expect(buttonWords(actions as HTMLElement)).toEqual(["Edit character", "Update from D&D Beyond"]);
  });
});

describe("CharacterSheetPage carrying values from an imported note in another campaign", () => {
  it("shows the imported value of the earlier campaign as carried over", async () => {
    const { load, rowOf } = openSheet({ texts: { [MIRA.path]: "", [OLD_MIRA]: IMPORTED }, carriedFrom: { path: OLD_MIRA, groups: ["values"] } });
    await load();
    const armour = rowOf("Armor Class");
    expect(textIn(armour, ".dd-value")).toBe("16");
    expect(textIn(armour, ".dd-value-source")).toBe("Carried from Ashen Road");
  });
});

describe("CharacterSheetPage with an imported inventory", () => {
  it("draws the imported panels after the values and before the stat block", async () => {
    const text = IMPORTED.replace("## Numbers", "## Inventory (from D&D Beyond)\n- Rope × 2\n## Numbers");
    const { load, root } = openSheet({ texts: { [MIRA.path]: text } });
    await load();
    const sections: string[] = [];
    for (const element of root.children) sections.push(element.className);
    const panels = sections.indexOf("dd-sheet-imported");
    expect(panels).toBeGreaterThan(sections.indexOf("dd-sheet-hint"));
    expect(panels).toBeLessThan(sections.indexOf("dd-sheet-stat-block"));
    expect(textIn(root, ".dd-sheet-imported .dd-panel-line .dd-text")).toBe("Rope");
  });

  it("draws no imported panels for a note nothing was imported into", async () => {
    const { load, root } = openSheet({ texts: { [MIRA.path]: "AC: 16\n" } });
    await load();
    expect(root.querySelector(".dd-sheet-imported")).toBeNull();
  });
});
