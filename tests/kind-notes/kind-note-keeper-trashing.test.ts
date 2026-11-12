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

  it("keeps a note whose properties hold one of his, read from the note itself, though the cache doesn't show it yet", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", tags: ["pale"], lines: ["? Who sent Mira"] }, "");
    notes.metadata.getFileCache.mockReturnValue({ frontmatter: { session: "[[Session 2]]", lines: ["? Who sent Mira"] } } as never);
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual([]);
  });

  it("trashes a note with no lines left and nothing of his, once it is settled, though its lines are empty already", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: [] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
  });

  it("writes nothing to a note with empty lines and his words, which is as it should be", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: [] }, "My notes");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([]);
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
  });

  it("counts blank lines below the properties as nothing of his, so a note with only those goes to the trash", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "  \n\n\t\n");
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
  });
});
