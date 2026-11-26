import { describe, expect, it } from "vitest";
import { fileAt } from "../../stubs/note-files";
import { CHANGED_IN_NOTE, PartlyWritten, WOULD_BE_HIDDEN, type EditorFiles, type Removal } from "../../../src/campaign/writing/note-editor";
import type { SessionChange } from "../../../src/campaign/changes/session-change";
import { LATER_NOTE_HIDDEN, SessionChangeWriter } from "../../../src/campaign/changes/session-change-writer";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

class FakeNotes {
  readonly texts: Map<string, string>;
  readonly written: string[] = [];
  readonly looked: string[] = [];
  failOn: string | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
    return {
      note: (path) => {
        this.looked.push(path);
        if (!this.texts.has(path)) return null;
        return fileAt(path);
      },
      change: async (file, change) => {
        if (file.path === this.failOn) throw new Error("disk full");
        this.written.push(file.path);
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.textOf(file.path),
    };
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

function lineAt(path: string, line: number, text: string): Removal {
  return { path, line, matches: (written) => written === text };
}

const NOTHING: SessionChange = { removal: null, added: null };
const WORDS = "The first lines were written, but not the rest:";

function apply(notes: FakeNotes, change: SessionChange): Promise<boolean> {
  return new SessionChangeWriter(notes.vault, STUB_SYNTAX).apply(change);
}

describe("SessionChangeWriter", () => {
  it("writes nothing, and looks at no note, for a change with no lines", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    expect(await apply(notes, NOTHING)).toBe(false);
    expect(notes.written).toEqual([]);
    expect(notes.looked).toEqual([]);
  });

  it("adds lines to one note in one change of it", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    expect(await apply(notes, { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira", "? Why, after: Who"], later: null } })).toBe(true);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n? Why, after: Who\n");
    expect(notes.written).toEqual([ONE]);
  });

  it("writes nothing, and looks at no note, when the one note to add to has no lines", async () => {
    const notes = new FakeNotes({});
    expect(await apply(notes, { ...NOTHING, added: { path: ONE, lines: [], later: null } })).toBe(false);
    expect(notes.looked).toEqual([]);
  });

  it("takes a line out and adds lines to its own note in one change of it", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\nWe rode on.\n" });
    await apply(notes, { ...NOTHING, removal: lineAt(ONE, 1, "?= Who: Mira"), added: { path: ONE, lines: ["?= Who: Lady Vess"], later: null } });
    expect(notes.texts.get(ONE)).toBe("? Who\nWe rode on.\n?= Who: Lady Vess\n");
    expect(notes.written).toEqual([ONE]);
  });

  it("adds lines to one note, then takes the line out of another", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "" });
    await apply(notes, { ...NOTHING, removal: lineAt(ONE, 1, "!= Find it: done"), added: { path: TWO, lines: ["!+ Find it: tracks"], later: null } });
    expect(notes.texts.get(ONE)).toBe("! Find it\n");
    expect(notes.texts.get(TWO)).toBe("!+ Find it: tracks\n");
    expect(notes.written).toEqual([TWO, ONE]);
  });

  it("refuses to take out a line that moved since it was read, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "We waited.\n!= Find it: done\n" });
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "!= Find it: done"), added: { path: ONE, lines: ["!+ Find it: tracks"], later: null } };
    await expect(apply(notes, change)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("We waited.\n!= Find it: done\n");
  });

  it("takes out a line on its own when nothing is added", async () => {
    const notes = new FakeNotes({ [ONE]: "$ +5 gp found\nWe rode on.\n" });
    expect(await apply(notes, { ...NOTHING, removal: lineAt(ONE, 0, "$ +5 gp found") })).toBe(true);
    expect(notes.texts.get(ONE)).toBe("We rode on.\n");
    expect(notes.written).toEqual([ONE]);
  });

  it("refuses to take out on its own a line that moved since it was read", async () => {
    const notes = new FakeNotes({ [ONE]: "We waited.\n$ +5 gp found\n" });
    await expect(apply(notes, { ...NOTHING, removal: lineAt(ONE, 0, "$ +5 gp found") })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("We waited.\n$ +5 gp found\n");
  });

  it("rewrites a line where it stands, in one change of its note", async () => {
    const notes = new FakeNotes({ [ONE]: "- $ +5 gp found\nWe rode on.\n" });
    expect(await apply(notes, { rewrite: { old: lineAt(ONE, 0, "- $ +5 gp found"), line: "$ +6 gp found" } })).toBe(true);
    expect(notes.texts.get(ONE)).toBe("- $ +6 gp found\nWe rode on.\n");
    expect(notes.written).toEqual([ONE]);
  });

  it("refuses to rewrite a line that moved since it was read", async () => {
    const notes = new FakeNotes({ [ONE]: "We waited.\n$ +5 gp found\n" });
    await expect(apply(notes, { rewrite: { old: lineAt(ONE, 0, "$ +5 gp found"), line: "$ +6 gp found" } })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("We waited.\n$ +5 gp found\n");
  });

  it("refuses lines that would land below a comment that never closes in the note as it is now, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n%% added by a sync\n" });
    await expect(apply(notes, { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: null } })).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("? Who\n%% added by a sync\n");
  });

  it("refuses lines added with a taken-out line when they would land hidden in the same note, keeping the old line", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n?= Who: Mira\n%% added by a sync\n" });
    const change = { ...NOTHING, removal: lineAt(ONE, 1, "?= Who: Mira"), added: { path: ONE, lines: ["?= Who: Vess"], later: null } };
    await expect(apply(notes, change)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n%% added by a sync\n");
  });

  it("refuses lines that would land hidden in another note than the one the line is taken out of, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "%% added by a sync\n" });
    const change = { ...NOTHING, removal: lineAt(ONE, 1, "!= Find it: done"), added: { path: TWO, lines: ["!+ Find it: tracks"], later: null } };
    await expect(apply(notes, change)).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done\n");
    expect(notes.texts.get(TWO)).toBe("%% added by a sync\n");
  });

  it("says the first note was written when the later note's lines would land hidden", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "%% added by a sync\n" });
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: { path: TWO, lines: ["? Why, after: Who"], partlyWritten: WORDS } } };
    const writing = apply(notes, change);
    await expect(writing).rejects.toBeInstanceOf(PartlyWritten);
    await expect(writing).rejects.toThrow(LATER_NOTE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
    expect(notes.texts.get(TWO)).toBe("%% added by a sync\n");
  });

  it("writes the later note after the first", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: { path: TWO, lines: ["? Why, after: Who"], partlyWritten: WORDS } } };
    expect(await apply(notes, change)).toBe(true);
    expect(notes.written).toEqual([ONE, TWO]);
    expect(notes.texts.get(TWO)).toBe("? Why, after: Who\n");
  });

  it("checks the later note is there before writing the first", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n" });
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: { path: TWO, lines: [], partlyWritten: WORDS } } };
    await expect(apply(notes, change)).rejects.toThrow(`${TWO} was moved or deleted`);
    expect(notes.written).toEqual([]);
  });

  it("says in the change's own words that only the first note was written when the later one couldn't be", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    notes.failOn = TWO;
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: { path: TWO, lines: ["? Why, after: Who"], partlyWritten: WORDS } } };
    const writing = apply(notes, change);
    await expect(writing).rejects.toBeInstanceOf(PartlyWritten);
    await expect(writing).rejects.toThrow(`${WORDS} disk full`);
    expect(notes.texts.get(ONE)).toBe("? Who\n?= Who: Mira\n");
  });

  it("passes the later note's failure on as it is when the first note had nothing to write", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    notes.failOn = TWO;
    const change = { ...NOTHING, added: { path: ONE, lines: [], later: { path: TWO, lines: ["? Why, after: Who"], partlyWritten: WORDS } } };
    const writing = apply(notes, change);
    await expect(writing).rejects.not.toBeInstanceOf(PartlyWritten);
    await expect(writing).rejects.toThrow("disk full");
  });

  it("says it wrote when either note had lines, and not when neither had", async () => {
    const notes = new FakeNotes({ [ONE]: "? Who\n", [TWO]: "" });
    const later = (lines: string[]) => ({ removal: null, added: { path: ONE, lines: [], later: { path: TWO, lines, partlyWritten: WORDS } } });
    expect(await apply(notes, later([]))).toBe(false);
    expect(await apply(notes, later(["? Why, after: Who"]))).toBe(true);
    const first = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"], later: { path: TWO, lines: [], partlyWritten: WORDS } } };
    expect(await apply(notes, first)).toBe(true);
  });
});
