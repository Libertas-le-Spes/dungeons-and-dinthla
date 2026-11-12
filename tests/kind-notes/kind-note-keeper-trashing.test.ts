import { describe, expect, it } from "vitest";
import { FakeNotes } from "./fake-notes";
import { keeperWith, QUESTIONS, SESSION, settled, wanted } from "./keeper-setup";

describe("KindNoteKeeper when a note's last line goes", () => {
  it("trashes a note that holds nothing of his", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
  });

  it("keeps a note with his words and empties its lines", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "My notes\n");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.words).toBe("My notes\n");
  });

  it("keeps a note with a property of his, and empties its lines", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", tags: ["pale"], lines: ["? Who sent Mira"] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: "[[Session 2]]", tags: ["pale"], lines: [] });
  });

  it("keeps a note whose words arrived since the plugin last looked, reading the note itself before it trashes", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "Just typed this");
    notes.metadata.getFileCache.mockReturnValue({ frontmatter: { session: "[[Session 2]]", lines: ["? Who sent Mira"] } } as never);
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual([]);
  });

  it("trashes the notes of a deleted session, found by the name its link holds", async () => {
    const notes = new FakeNotes();
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, null, [])]);
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
  });

  it("leaves a note alone when its session is gone and its link names another session", async () => {
    const notes = new FakeNotes();
    notes.addNote(QUESTIONS, { session: "[[Session 3]]", lines: ["? Who sent Mira"] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, null, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
  });

  it("trashes nothing when there was no note", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.created).toEqual([]);
  });
});
