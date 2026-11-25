import { beforeEach, describe, expect, it, vi } from "vitest";
import { sheetValueNamed } from "../builders/sheet-value-named";
import type { TFile } from "obsidian";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { CHANGED_IN_NOTE } from "../../../src/campaign/writing/note-editor";
import { NoSessionToWrite, SESSIONS_SHARE_A_NUMBER } from "../../../src/campaign/paths/session-to-write";
import { carriedValuesOf, characterSheetOf, type SheetValue } from "../../../src/characters/reading/character-sheet";
import { noteNameOf } from "../../../src/campaign/paths/note-name";
import { NoSessionNamed } from "../../../src/characters/editing/no-session-named";
import { OpenedSession } from "../../../src/campaign/paths/session-gone";
import { chooseSheetValue, NO_SESSION, sameSheetValue, saveSheetValue } from "../../../src/characters/editing/open-character-sheet";
import { readCharacterSheet } from "../../../src/characters/reading/read-character-sheet";
import type { SheetNotes } from "../../../src/characters/reading/sheet-notes";
import type { SheetValueDialog } from "../../../src/characters/editing/sheet-value-dialog";
import type { SourcedFact } from "../../../src/characters/reading/sheet-values";
import { Notice, openedModals } from "../../stubs/obsidian";
import type { GateWithNotes } from "../../host/gate-with-notes";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";
import { lastDialog } from "../../campaign/dialog-campaign";

const NONE_NAMED = new NoSessionNamed(NO_SESSION);
const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

beforeEach(() => {
  Notice.shown = [];
});

function setUp(texts: Record<string, string>, { readFails = false, folders = ["Pale Moon"], sessions = [ONE, TWO] } = {}) {
  const notesText = new Map(Object.entries(texts));
  const madeFiles = new Map<string, TFile>([[MIRA.path, MIRA]]);
  const gate = {
    notes: {
      store: {
        note: (path: string) => {
          if (!notesText.has(path)) return null;
          const known = madeFiles.get(path);
          if (known !== undefined) return known;
          const made = { path, basename: noteNameOf(path) } as TFile;
          madeFiles.set(path, made);
          return made;
        },
        read: async (file: NoteRef) => notesText.get(file.path)!,
        change: async (file: NoteRef, change: (text: string) => string) => {
          const text = change(notesText.get(file.path)!);
          notesText.set(file.path, text);
          return text;
        },
      },
      links: {
        linkTextTo: () => "Mira",
      },
    },
  } as unknown as GateWithNotes;
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
  const remake = (path: string, text: string) => {
    madeFiles.delete(path);
    notesText.set(path, text);
  };
  return { gate, store, notes, notesText, remake };
}

function acOf(learned: SourcedFact[], overrides: SourcedFact[] = []): SheetValue {
  return sheetValueNamed(characterSheetOf({ learned, imported: [], overrides, carried: null }), "AC");
}

const LEARNED_15: SourcedFact = { name: "AC", value: "15", source: { path: ONE, line: 0 } };

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

  it("tells apart a value imported again with another number", () => {
    const importedAc = (value: string) => {
      const imported = { name: "AC", value, source: { path: MIRA.path, line: 2 } };
      return sheetValueNamed(characterSheetOf({ learned: [LEARNED_15], imported: [imported], overrides: [], carried: null }), "AC");
    };
    expect(sameSheetValue(importedAc("16"), importedAc("16"))).toBe(true);
    expect(sameSheetValue(importedAc("16"), importedAc("17"))).toBe(false);
  });

  it("tells apart a value carried from another campaign that changed there", () => {
    const carriedAc = (value: string) => {
      const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [], imported: [], overrides: [{ name: "AC", value, source: { path: "Ashen Road/Characters/Mira.md", line: 0 } }], groups: ["values"] });
      return sheetValueNamed(characterSheetOf({ learned: [], imported: [], overrides: [], carried }), "AC");
    };
    expect(sameSheetValue(carriedAc("13"), carriedAc("13"))).toBe(true);
    expect(sameSheetValue(carriedAc("13"), carriedAc("14"))).toBe(false);
  });
});

describe("saveSheetValue", () => {
  it("adds a learned value to the session named, linked to the character", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "[[Mira]] AC: 15", [TWO]: "Notes\n" });
    expect(await saveSheetValue(gate.notes, store, notes, MIRA, acOf([LEARNED_15]), { state: "learned", value: "16" }, new OpenedSession(gate.notes.store, TWO), STUB_SYNTAX)).toBe(true);
    expect(notesText.get(TWO)).toBe("Notes\n[[Mira]] AC: 16\n");
  });

  it("marks a value not known in the session named, so a value learned later still shows", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "AC: 16", [ONE]: "[[Mira]] AC: 15", [TWO]: "" });
    const opened = acOf([LEARNED_15], [{ name: "AC", value: "16", source: { path: MIRA.path, line: 0 } }]);
    expect(await saveSheetValue(gate.notes, store, notes, MIRA, opened, { state: "unknown", value: "" }, new OpenedSession(gate.notes.store, TWO), STUB_SYNTAX)).toBe(true);
    expect(notesText.get(TWO)).toBe("[[Mira]] AC: ?\n");
    expect(notesText.get(MIRA.path)).toBe("");
    let read = await readCharacterSheet(MIRA, store, notes, STUB_SYNTAX);
    expect(read.sheet.values.find((value) => value.name === "AC")!.state).toBe("unknown");
    notesText.set(TWO, "[[Mira]] AC: ?\nLater that night\n[[Mira]] AC: 18\n");
    read = await readCharacterSheet(MIRA, store, notes, STUB_SYNTAX);
    const ac = read.sheet.values.find((value) => value.name === "AC")!;
    expect([ac.state, ac.shown!.value]).toEqual(["learned", "18"]);
  });

  it("writes nothing when the value changed since the dialog opened", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "AC: 18", [ONE]: "[[Mira]] AC: 15" });
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, acOf([LEARNED_15]), { state: "override", value: "16" }, NONE_NAMED, STUB_SYNTAX)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notesText.get(MIRA.path)).toBe("AC: 18");
  });

  it("refuses a learned value for a character outside any campaign", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "" }, { folders: [] });
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, acOf([]), { state: "learned", value: "16" }, NONE_NAMED, STUB_SYNTAX)).rejects.toThrow(NO_SESSION);
  });

  it("refuses a learned value for a character outside any campaign as having no session to write in", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "" }, { folders: [] });
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, acOf([]), { state: "learned", value: "16" }, NONE_NAMED, STUB_SYNTAX)).rejects.toBeInstanceOf(NoSessionToWrite);
  });

  it("refuses a learned value when no session was named, even though one has been started since", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "Notes\n" });
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, acOf([]), { state: "learned", value: "16" }, NONE_NAMED, STUB_SYNTAX)).rejects.toThrow(NO_SESSION);
    expect(notesText.get(ONE)).toBe("Notes\n");
  });

  it("refuses a learned value when the campaign has no session notes", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "" });
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, acOf([]), { state: "learned", value: "16" }, NONE_NAMED, STUB_SYNTAX)).rejects.toThrow(NO_SESSION);
    expect(notesText.get(MIRA.path)).toBe("");
  });

  it("keeps the reason when the dialog opened with two session notes sharing the latest number, and writes nothing", async () => {
    const oneAgain = "Pale Moon/Sessions/Session 01.md";
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "", [oneAgain]: "" }, { sessions: [ONE, oneAgain] });
    await chooseSheetValue(OBSIDIAN_SHOWING, gate.notes, store, notes, MIRA, acOf([]), vi.fn(), vi.fn(), STUB_SYNTAX);
    const modal = lastDialog<{ dialog: SheetValueDialog }>();
    await expect(modal.dialog.save({ state: "learned", value: "16" })).rejects.toThrow(SESSIONS_SHARE_A_NUMBER);
    expect([notesText.get(ONE), notesText.get(oneAgain)]).toEqual(["", ""]);
  });
});

describe("saveSheetValue, with the session the dialog named", () => {
  it("writes in the session the dialog named, not the latest", async () => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "", [ONE]: "Notes\n", [TWO]: "Later\n" });
    expect(await saveSheetValue(gate.notes, store, notes, MIRA, acOf([]), { state: "learned", value: "16" }, new OpenedSession(gate.notes.store, ONE), STUB_SYNTAX)).toBe(true);
    expect(notesText.get(ONE)).toBe("Notes\n[[Mira]] AC: 16\n");
    expect(notesText.get(TWO)).toBe("Later\n");
  });

  it.each([
    ["Learned at the table", { state: "learned", value: "16" }],
    ["Not known yet", { state: "unknown", value: "" }],
  ] as const)("refuses %s with the session gone words when the session's note is gone, writing nothing and not using another session", async (_name, choice) => {
    const { gate, store, notes, notesText } = setUp({ [MIRA.path]: "AC: 16", [ONE]: "[[Mira]] AC: 15\n", [TWO]: "Later\n" });
    const opened = acOf([LEARNED_15], [{ name: "AC", value: "16", source: { path: MIRA.path, line: 0 } }]);
    const named = new OpenedSession(gate.notes.store, TWO);
    notesText.delete(TWO);
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, opened, choice, named, STUB_SYNTAX)).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect([notesText.get(MIRA.path), notesText.get(ONE)]).toEqual(["AC: 16", "[[Mira]] AC: 15\n"]);
  });
});

describe("saveSheetValue, when another note has taken the named session's path", () => {
  it.each([
    ["Learned at the table", { state: "learned", value: "16" }],
    ["Not known yet", { state: "unknown", value: "" }],
  ] as const)("refuses %s, writing into neither note, when the session was renumbered or made again", async (_name, choice) => {
    const { gate, store, notes, notesText, remake } = setUp({ [MIRA.path]: "AC: 16", [ONE]: "[[Mira]] AC: 15\n", [TWO]: "Two\n" });
    const opened = acOf([LEARNED_15], [{ name: "AC", value: "16", source: { path: MIRA.path, line: 0 } }]);
    const named = new OpenedSession(gate.notes.store, TWO);
    remake(TWO, "Another\n");
    await expect(saveSheetValue(gate.notes, store, notes, MIRA, opened, choice, named, STUB_SYNTAX)).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect([notesText.get(MIRA.path), notesText.get(ONE), notesText.get(TWO)]).toEqual(["AC: 16", "[[Mira]] AC: 15\n", "Another\n"]);
  });
});

describe("chooseSheetValue", () => {
  it("opens the dialog, naming the session a learned value goes in", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "", [ONE]: "", [TWO]: "" });
    const before = openedModals.length;
    await chooseSheetValue(OBSIDIAN_SHOWING, gate.notes, store, notes, MIRA, acOf([]), vi.fn(), vi.fn(), STUB_SYNTAX);
    expect(openedModals.length).toBe(before + 1);
    const modal = lastDialog<{ dialog: SheetValueDialog }>();
    expect(modal.dialog.sessionLabel).toBe("Session 2");
  });

  it("names no session when there's none to write in", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "" });
    await chooseSheetValue(OBSIDIAN_SHOWING, gate.notes, store, notes, MIRA, acOf([]), vi.fn(), vi.fn(), STUB_SYNTAX);
    const modal = lastDialog<{ dialog: SheetValueDialog }>();
    expect(modal.dialog.sessionLabel).toBeNull();
  });

  it("names no session for a character outside any campaign", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "" }, { folders: [] });
    await chooseSheetValue(OBSIDIAN_SHOWING, gate.notes, store, notes, MIRA, acOf([]), vi.fn(), vi.fn(), STUB_SYNTAX);
    const modal = lastDialog<{ dialog: SheetValueDialog }>();
    expect(modal.dialog.sessionLabel).toBeNull();
    expect(Notice.shown).toEqual([]);
  });

  it("says why when the note can't be read", async () => {
    const { gate, store, notes } = setUp({ [MIRA.path]: "" }, { readFails: true });
    const before = openedModals.length;
    await chooseSheetValue(OBSIDIAN_SHOWING, gate.notes, store, notes, MIRA, acOf([]), vi.fn(), vi.fn(), STUB_SYNTAX);
    expect(Notice.shown).toEqual(["Couldn't read Mira: the disk is gone"]);
    expect(openedModals.length).toBe(before);
  });
});
