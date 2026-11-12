import { describe, expect, it } from "vitest";
import { FakeNotes } from "../fake-notes";
import { keeperWith, QUESTIONS, SESSION, settled, wanted } from "../keeper-setup";

const LINES = ["? Who sent Mira"];
const NOT_LINKED = `${QUESTIONS} already exists but isn't linked to its session in its properties, so it was left alone.`;

function nothingTouched(notes: FakeNotes): void {
  expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
  expect(notes.files.process).not.toHaveBeenCalled();
  expect(notes.files.create).not.toHaveBeenCalled();
  expect(notes.trashed).toEqual([]);
}

describe("KindNoteKeeper leaving a note that isn't its own", () => {
  it("leaves a hand-made note with no properties alone, and says so once", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, null, "My own questions");
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, ["? Another"])]);
    await settled();
    nothingTouched(notes);
    expect(notes.said).toEqual([NOT_LINKED]);
    expect(notes.noteAt(QUESTIONS)?.words).toBe("My own questions");
  });

  it("leaves a note that links another session alone", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addSession("D&D/Pale Moon/Sessions/Session 3.md");
    notes.addNote(QUESTIONS, { session: "[[Session 3]]", lines: LINES }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    nothingTouched(notes);
    expect(notes.said).toEqual([NOT_LINKED]);
  });

  it("leaves a note alone whose session property is not a link", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: 2, lines: LINES }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    nothingTouched(notes);
  });

  it("leaves a note alone whose session property links two notes", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]] [[Session 3]]", lines: LINES }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    nothingTouched(notes);
  });

  it("leaves a note alone that links the Session 2 of another campaign", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addSession("D&D/Dark Tide/Sessions/Session 2.md");
    notes.addNote(QUESTIONS, { session: "[[D&D/Dark Tide/Sessions/Session 2]]", lines: LINES }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    nothingTouched(notes);
  });

  it("waits for Obsidian to read a note it hasn't read yet, and writes once it has", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: [] }, "");
    notes.unread.add(QUESTIONS);
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    nothingTouched(notes);
    notes.unread.clear();
    keeper.noteRead(QUESTIONS);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(LINES);
  });

  it("does nothing when a note is read that it wasn't waiting for", async () => {
    const notes = new FakeNotes();
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    keeperWith(notes).noteRead(QUESTIONS);
    await settled();
    nothingTouched(notes);
  });

  it("finishes an empty file at its path, the half of a note a crash left behind", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, null, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: "[[Session 2]]", lines: LINES });
    expect(notes.said).toEqual([]);
  });

  it("doesn't finish a file with one character in it, which is somebody's", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, null, "x");
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    nothingTouched(notes);
    expect(notes.said).toEqual([NOT_LINKED]);
  });

  it("doesn't finish an empty file when the session has no line of that kind", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, null, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    nothingTouched(notes);
  });

  it("doesn't finish an empty file for a session that is gone", async () => {
    const notes = new FakeNotes();
    notes.addNote(QUESTIONS, null, "");
    keeperWith(notes).keep([wanted(QUESTIONS, null, LINES)]);
    await settled();
    nothingTouched(notes);
  });
});
