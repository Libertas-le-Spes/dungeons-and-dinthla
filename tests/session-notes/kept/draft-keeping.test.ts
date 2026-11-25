import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it, vi } from "vitest";
import { Fence } from "../../../src/fence/paths/fence";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { DraftKeeping } from "../../../src/session-notes/kept/draft-keeping";
import { DELETED, MISSING } from "../../../src/session-notes/kept/kinds/kept-kinds";
import { InMemoryNotes } from "../../host/in-memory-notes";

const FOLDER = "D&D";
const ONE = "D&D/Pale Moon/Sessions/Session 1.md";
const TWO = "D&D/Pale Moon/Sessions/Session 2.md";
const OUTSIDE = "Games/Pale Moon/Sessions/Session 1.md";
const NOTE_KEY = "note:D&D/Pale Moon/Characters/Mira.md";
const AT = 1_000;

function keepingWith(kept: Record<string, string>, paths: string[]) {
  const notes = new InMemoryNotes();
  for (const path of paths) notes.put(path, "");
  const store = { note: vi.fn(notes.note.bind(notes)) };
  const fence = new Fence(() => FOLDER, ".obsidian", STUB_SPELLING);
  const drafts = new Drafts(kept, () => {});
  const keeping = new DraftKeeping(drafts, { changes: notes, store, fence, campaignsFolder: () => FOLDER, now: () => AT });
  keeping.start();
  return { keeping, drafts, notes, store };
}

function keptOf(keeping: DraftKeeping): unknown[][] {
  return keeping.keptDrafts.kept().map((draft) => [draft.kind, draft.path, draft.text]);
}

describe("DraftKeeping", () => {
  it("sets aside the lines of a session note inside the Campaigns folder that is gone", () => {
    const { keeping, drafts } = keepingWith({ [ONE]: "? Who" }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(ONE)).toBe("");
    expect(keptOf(keeping)).toEqual([[MISSING, ONE, "? Who"]]);
  });

  it("keeps the lines of a session note the fence finds", () => {
    const { keeping, drafts } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(ONE)).toBe("? Who");
    expect(keptOf(keeping)).toEqual([]);
  });

  it("keeps the lines of a note outside the Campaigns folder live, so changing the folder sets nothing aside", () => {
    const { keeping, drafts, store } = keepingWith({ [OUTSIDE]: "? Who" }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(OUTSIDE)).toBe("? Who");
    expect(keptOf(keeping)).toEqual([]);
    expect(store.note).not.toHaveBeenCalled();
  });

  it("keeps a whole-note draft live without looking its note up", () => {
    const { keeping, drafts, store } = keepingWith({ [NOTE_KEY]: '{"base":"","text":"Mira"}' }, []);
    keeping.setAsideGoneNotes();
    expect(drafts.textOf(NOTE_KEY)).toBe('{"base":"","text":"Mira"}');
    expect(store.note).not.toHaveBeenCalled();
  });

  it("moves a session note's lines with the note when it is renamed", async () => {
    const { drafts, notes } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    await notes.move(notes.note(ONE)!, TWO);
    expect(drafts.textOf(TWO)).toBe("? Who");
    expect(drafts.textOf(ONE)).toBe("");
  });

  it("moves a whole-note draft with its note when it is renamed", async () => {
    const { drafts, notes } = keepingWith({ [NOTE_KEY]: '{"base":"","text":"Mira"}' }, ["D&D/Pale Moon/Characters/Mira.md"]);
    await notes.move(notes.note("D&D/Pale Moon/Characters/Mira.md")!, "D&D/Pale Moon/Characters/Mira Vale.md");
    expect(drafts.textOf("note:D&D/Pale Moon/Characters/Mira Vale.md")).toBe('{"base":"","text":"Mira"}');
  });

  it("sets aside a session note's lines when the note is deleted", async () => {
    const { keeping, notes } = keepingWith({ [ONE]: "? Who" }, [ONE]);
    await notes.throwAway(notes.note(ONE)!);
    expect(keptOf(keeping)).toEqual([[DELETED, ONE, "? Who"]]);
  });

  it("stops following moved and deleted notes once stopped", async () => {
    const { keeping, drafts, notes } = keepingWith({ [ONE]: "? Who", [TWO]: "! Ride" }, [ONE, TWO]);
    keeping.stop();
    await notes.move(notes.note(ONE)!, "D&D/Pale Moon/Sessions/Session 3.md");
    await notes.throwAway(notes.note(TWO)!);
    expect([drafts.textOf(ONE), drafts.textOf(TWO)]).toEqual(["? Who", "! Ride"]);
    expect(keptOf(keeping)).toEqual([]);
  });
});
