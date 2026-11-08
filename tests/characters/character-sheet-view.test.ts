import { afterEach, describe, expect, it, vi } from "vitest";
import type { TFile, WorkspaceLeaf } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import { CharacterSheetView, TAP_A_VALUE, type SheetActions } from "../../src/characters/character-sheet-view";
import type { SheetValue } from "../../src/characters/character-sheet";
import type { CarriedFrom, SheetNotes } from "../../src/characters/sheet-notes";
import { obsidianDocument } from "../views/obsidian-dom";

function fileAt(path: string): TFile {
  return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
}

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const OLD_MIRA = "Ashen Road/Characters/Mira.md";
const ONE = "Pale Moon/Sessions/Session 1.md";

interface Setup {
  sessions?: string[];
  texts?: Record<string, string>;
  carriedFrom?: CarriedFrom | null;
  textOf?: SheetNotes["textOf"];
}

function openSheet({ sessions = [], texts = {}, carriedFrom = null, textOf }: Setup = {}) {
  let listener = () => {};
  let noteChanged: (path: string) => void = () => {};
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
  };
  const closers: (() => void)[] = [];
  const chosen: SheetValue[] = [];
  const actions: SheetActions = {
    openRow: vi.fn(),
    openLink: vi.fn(),
    editCharacter: vi.fn(),
    chooseValue: (_file, value, onClosed) => {
      chosen.push(value);
      closers.push(onClosed);
    },
  };
  const view = new CharacterSheetView({} as WorkspaceLeaf, store, notes, actions);
  view.contentEl = obsidianDocument().createElement("div");
  view.contentEl.ownerDocument.body.append(view.contentEl);
  view.onload();
  const root = view.contentEl;
  const load = async (file = MIRA) => {
    view.file = file;
    await view.onLoadFile(file);
  };
  const button = (name: string) => root.querySelector<HTMLButtonElement>(`.dd-value[data-name="${name}"]`)!;
  const rowOf = (label: string) =>
    Array.from(root.querySelectorAll(".dd-sheet-row")).find((row) => row.querySelector(".dd-sheet-label")!.textContent === label)!;
  return {
    view,
    root,
    store,
    reads,
    actions,
    chosen,
    closers,
    load,
    button,
    rowOf,
    listener: () => listener(),
    noteChanged: (path: string) => noteChanged(path),
  };
}

function textsOf(root: Element, selector: string): string[] {
  return Array.from(root.querySelectorAll(selector)).map((element) => String(element.textContent));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CharacterSheetView", () => {
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
    const sheet = openSheet({ texts: { [MIRA.path]: "subtitle: ?" } });
    await sheet.load();
    expect(sheet.root.querySelector(".dd-sheet-subtitle")).toBeNull();
  });

  it("shows each ability score with its modifier, but none for a score not known", async () => {
    const sheet = openSheet({ sessions: ["[[Mira]] DEX: 17, STR: 8"] });
    await sheet.load();
    expect(textsOf(sheet.root, ".dd-sheet-ability .dd-modifier")).toEqual(["(−1)", "(+3)"]);
  });

  it("marks each value with its state, in words for those who can't see the colour", async () => {
    const sheet = openSheet({
      sessions: ["[[Mira]] AC: 15, HP: 30"],
      texts: { [MIRA.path]: "HP: 44\nspeed: ?", [OLD_MIRA]: "class: Ranger" },
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
    await vi.waitFor(() => expect(sheet.root.ownerDocument.activeElement).toBe(sheet.button("AC")));
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
    await vi.waitFor(() => expect(sheet.reads.count).toBe(reads + 1));
    await vi.waitFor(() => expect(sheet.button("HP")).not.toBeNull());
    expect(sheet.root.ownerDocument.activeElement).not.toBe(sheet.button("AC"));
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
    await vi.waitFor(() => expect(sheet.button("AC").textContent).toBe("15"));
  });

  it("draws again when the character's note, a note in its campaign or the note it was carried from changes, and not otherwise", async () => {
    const sheet = openSheet({ carriedFrom: { path: OLD_MIRA, groups: ["values"] } });
    await sheet.load();
    const before = sheet.reads.count;
    sheet.noteChanged("Elsewhere/Note.md");
    sheet.noteChanged("Ashen Road/Characters/Other.md");
    sheet.noteChanged("Pale Moonlight/Note.md");
    expect(sheet.reads.count).toBe(before);
    sheet.noteChanged(MIRA.path);
    sheet.noteChanged("Pale Moon/Sessions/Session 2.md");
    sheet.noteChanged(OLD_MIRA);
    await vi.waitFor(() => expect(sheet.reads.count).toBe(before + 6));
  });

  it("draws only the latest reading when readings finish out of order", async () => {
    const pending: ((text: string) => void)[] = [];
    const sheet = openSheet({ textOf: (file) => new Promise((resolve) => {
      if (file.path === MIRA.path) pending.push(resolve);
      else resolve("");
    }) });
    const first = sheet.load();
    const second = sheet.load();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    pending[1]!("AC: 16");
    await second;
    pending[0]!("AC: 9");
    await first;
    expect(sheet.button("AC").textContent).toBe("16");
  });

  it("empties the sheet when its note is unloaded, dropping a reading still on its way", async () => {
    const pending: ((text: string) => void)[] = [];
    const sheet = openSheet({ textOf: (file) => new Promise((resolve) => {
      if (file.path === MIRA.path) pending.push(resolve);
      else resolve("");
    }) });
    const loading = sheet.load();
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    await sheet.view.onUnloadFile();
    pending[0]!("AC: 16");
    await loading;
    expect(sheet.root.childElementCount).toBe(0);
  });

  it("draws the new name after the note is renamed", async () => {
    const sheet = openSheet();
    await sheet.load();
    await sheet.view.onRename(fileAt("Pale Moon/Characters/Mirabel.md"));
    expect(textsOf(sheet.root, ".dd-sheet-name")).toEqual(["Mirabel"]);
  });
});
