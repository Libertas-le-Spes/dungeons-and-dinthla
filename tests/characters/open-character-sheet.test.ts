import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import type { SessionNote } from "../../src/campaign/campaign";
import { CHANGED_IN_NOTE } from "../../src/campaign/note-editor";
import { SESSIONS_SHARE_A_NUMBER } from "../../src/campaign/session-to-write";
import { carriedValuesOf, characterSheetOf, type SheetValue } from "../../src/characters/character-sheet";
import { chooseSheetValue, NO_SESSION, openCharacterSheet, sameSheetValue, saveSheetValue } from "../../src/characters/open-character-sheet";
import { readCharacterSheet } from "../../src/characters/read-character-sheet";
import type { SheetNotes } from "../../src/characters/sheet-notes";
import type { SheetValueDialog } from "../../src/characters/sheet-value-modal";
import type { SourcedFact } from "../../src/characters/sheet-values";
import { Notice, openedModals } from "../stubs/obsidian";
import type { Gate } from "../../src/fence/gatekeeper";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

beforeEach(() => {
  Notice.shown = [];
});

function setUp(texts: Record<string, string>, { readFails = false, folders = ["Pale Moon"], sessions = [ONE, TWO] } = {}) {
  const notesText = new Map(Object.entries(texts));
  const opened: { newLeaf: unknown; path: string; options: unknown }[] = [];
  const app = {
    workspace: {
      getLeaf: (newLeaf: unknown) => ({ openFile: async (file: TFile, options: unknown) => opened.push({ newLeaf, path: file.path, options }) }),
    },
  } as unknown as App;
  const gate = {
    files: {
      getFileByPath: (path: string) => {
        if (!notesText.has(path)) return null;
        return { path, basename: path.slice(path.lastIndexOf("/") + 1, -3) } as TFile;
      },
      read: async (file: TFile) => notesText.get(file.path)!,
      process: async (file: TFile, change: (text: string) => string) => {
        const text = change(notesText.get(file.path)!);
        notesText.set(file.path, text);
        return text;
      },
    },
    metadata: {
      fileToLinktext: () => "Mira",
    },
  } as unknown as Gate;
  const sessionNotes = (): SessionNote[] =>
    sessions.filter((path) => notesText.has(path)).map((path, index) => ({ path, number: index + 1, firstLine: 0, text: notesText.get(path)! }));
  const store = {
    campaignFolder: "Pale Moon",
    get sessionNotes() {
      return sessionNotes();
    },
  };
  const notes = {
    textOf: async (file: TFile) => {
      if (readFails) throw new Error("the disk is gone");
      return notesText.get(file.path)!;
    },
    pathOfLink: (linktext: string) => `Pale Moon/Characters/${linktext}.md`,
    campaignFolders: () => folders,
    sessionsOf: async () => [],
    fileAt: () => null,
    carriedFromOf: () => null,
  } as unknown as SheetNotes;
  return { app, gate, store, notes, notesText, opened };
}

function acOf(learned: SourcedFact[], overrides: SourcedFact[] = []): SheetValue {
  return characterSheetOf(learned, overrides, null).values.find((value) => value.name === "AC")!;
}

const LEARNED_15: SourcedFact = { name: "AC", value: "15", source: { path: ONE, line: 0 } };

describe("openCharacterSheet", () => {
  it("opens the character's note in the tab in use, where the campaign tab shows it as their sheet", async () => {
    const { app, gate, opened } = setUp({ [MIRA.path]: "" });
    await openCharacterSheet(app, gate, MIRA.path);
    expect(opened).toEqual([{ newLeaf: false, path: MIRA.path, options: { active: true } }]);
  });

  it("opens nothing for a note that's gone", async () => {
    const { app, gate, opened } = setUp({});
    await openCharacterSheet(app, gate, MIRA.path);
    expect(opened).toEqual([]);
  });
});

describe("sameSheetValue", () => {
  it("matches a value read again unchanged", () => {
    expect(sameSheetValue(acOf([LEARNED_15]), acOf([LEARNED_15]))).toBe(true);
  });

  it("tells apart a value learned again, an override and a learned line that moved", () => {
    const moved = { ...LEARNED_15, source: { path: ONE, line: 1 } };
    expect(sameSheetValue(acOf([LEARNED_15]), acOf([LEARNED_15, { ...LEARNED_15, value: "16" }]))).toBe(false);
    expect(sameSheetValue(acOf([LEARNED_15]), acOf([LEARNED_15], [{ name: "AC", value: "16", source: { path: MIRA.path, line: 0 } }]))).toBe(false);
    expect(sameSheetValue(acOf([LEARNED_15]), acOf([moved]))).toBe(false);
    const override = (value: string): SourcedFact => ({ name: "AC", value, source: { path: MIRA.path, line: 0 } });
    expect(sameSheetValue(acOf([], [override("16")]), acOf([], [override("18")]))).toBe(false);
  });

  it("tells apart a value carried from another campaign that changed there", () => {
    const carriedAc = (value: string) => {
      const carried = carriedValuesOf("Ashen Road", [], [{ name: "AC", value, source: { path: "Ashen Road/Characters/Mira.md", line: 0 } }], ["values"]);
      return characterSheetOf([], [], carried).values.find((sheetValue) => sheetValue.name === "AC")!;
    };
    expect(sameSheetValue(carriedAc("13"), carriedAc("13"))).toBe(true);
    expect(sameSheetValue(carriedAc("13"), carriedAc("14"))).toBe(false);
  });
});

describe("saveSheetValue", () => {
  it("adds a learned value to the latest session, linked to the character", async () => {
    const { app, gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "[[Mira]] AC: 15", [TWO]: "Notes\n" });
    expect(await saveSheetValue(app, gate, store, notes, MIRA, acOf([LEARNED_15]), { state: "learned", value: "16" })).toBe(true);
    expect(notesText.get(TWO)).toBe("Notes\n[[Mira]] AC: 16\n");
  });

  it("marks a value not known in the latest session, so a value learned later still shows", async () => {
    const { app, gate, store, notes, notesText } = setUp({ [MIRA.path]: "AC: 16", [ONE]: "[[Mira]] AC: 15", [TWO]: "" });
    const opened = acOf([LEARNED_15], [{ name: "AC", value: "16", source: { path: MIRA.path, line: 0 } }]);
    expect(await saveSheetValue(app, gate, store, notes, MIRA, opened, { state: "unknown", value: "" })).toBe(true);
    expect(notesText.get(TWO)).toBe("[[Mira]] AC: ?\n");
    expect(notesText.get(MIRA.path)).toBe("");
    let read = await readCharacterSheet(MIRA, store, notes);
    expect(read.sheet.values.find((value) => value.name === "AC")!.state).toBe("unknown");
    notesText.set(TWO, "[[Mira]] AC: ?\nLater that night\n[[Mira]] AC: 18\n");
    read = await readCharacterSheet(MIRA, store, notes);
    const ac = read.sheet.values.find((value) => value.name === "AC")!;
    expect([ac.state, ac.shown!.value]).toEqual(["learned", "18"]);
  });

  it("writes nothing when the value changed since the dialog opened", async () => {
    const { app, gate, store, notes, notesText } = setUp({ [MIRA.path]: "AC: 18", [ONE]: "[[Mira]] AC: 15" });
    await expect(saveSheetValue(app, gate, store, notes, MIRA, acOf([LEARNED_15]), { state: "override", value: "16" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notesText.get(MIRA.path)).toBe("AC: 18");
  });

  it("refuses a learned value for a character outside any campaign", async () => {
    const { app, gate, store, notes } = setUp({ [MIRA.path]: "" }, { folders: [] });
    await expect(saveSheetValue(app, gate, store, notes, MIRA, acOf([]), { state: "learned", value: "16" })).rejects.toThrow(NO_SESSION);
  });

  it("refuses a learned value when the campaign has no session notes", async () => {
    const { app, gate, store, notes, notesText } = setUp({ [MIRA.path]: "" });
    await expect(saveSheetValue(app, gate, store, notes, MIRA, acOf([]), { state: "learned", value: "16" })).rejects.toThrow(NO_SESSION);
    expect(notesText.get(MIRA.path)).toBe("");
  });

  it("refuses a learned value when two session notes share the latest number", async () => {
    const oneAgain = "Pale Moon/Sessions/Session 01.md";
    const { app, gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "", [oneAgain]: "" }, { sessions: [ONE, oneAgain] });
    await expect(saveSheetValue(app, gate, store, notes, MIRA, acOf([]), { state: "learned", value: "16" })).rejects.toThrow(SESSIONS_SHARE_A_NUMBER);
    expect([notesText.get(ONE), notesText.get(oneAgain)]).toEqual(["", ""]);
  });
});

describe("chooseSheetValue", () => {
  it("opens the dialog, naming the session a learned value goes in", async () => {
    const { app, gate, store, notes } = setUp({ [MIRA.path]: "", [ONE]: "", [TWO]: "" });
    const before = openedModals.length;
    await chooseSheetValue(app, gate, store, notes, MIRA, acOf([]), vi.fn(), vi.fn());
    expect(openedModals.length).toBe(before + 1);
    const modal = openedModals[openedModals.length - 1] as unknown as { dialog: SheetValueDialog };
    expect(modal.dialog.sessionLabel).toBe("Session 2");
  });

  it("names no session when there's none to write in", async () => {
    const { app, gate, store, notes } = setUp({ [MIRA.path]: "" });
    await chooseSheetValue(app, gate, store, notes, MIRA, acOf([]), vi.fn(), vi.fn());
    const modal = openedModals[openedModals.length - 1] as unknown as { dialog: SheetValueDialog };
    expect(modal.dialog.sessionLabel).toBeNull();
  });

  it("says why when the note can't be read", async () => {
    const { app, gate, store, notes } = setUp({ [MIRA.path]: "" }, { readFails: true });
    const before = openedModals.length;
    await chooseSheetValue(app, gate, store, notes, MIRA, acOf([]), vi.fn(), vi.fn());
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
    expect(openedModals.length).toBe(before);
  });
});
