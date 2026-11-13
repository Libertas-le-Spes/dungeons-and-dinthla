import { describe, expect, it } from "vitest";
import { FakeNotes } from "../fake-notes";
import { keeperWith, QUESTIONS, SESSION, settled, wanted } from "../keeper-setup";

const LINES = ["? Who sent Mira"];

describe("KindNoteKeeper telling whether a note differs from its session", () => {
  it("says a note whose lines differ from the session's does", () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    expect(keeperWith(notes).isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(true);
  });

  it("says a note whose lines match the session's doesn't", () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: LINES }, "");
    expect(keeperWith(notes).isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(false);
  });

  it("says there is no difference when there is no note", () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    expect(keeperWith(notes).isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(false);
  });

  it("says there is no difference for a note that isn't linked to the session", () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, null, "My own questions");
    expect(keeperWith(notes).isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(false);
  });

  it("says there is no difference for a note Obsidian hasn't read yet", () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    notes.unread.add(QUESTIONS);
    expect(keeperWith(notes).isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(false);
  });

  it("says there is no difference for lines it has just written, though Obsidian still shows the old ones", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "");
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    notes.metadata.getFileCache.mockReturnValue({ frontmatter: { session: "[[Session 2]]", lines: ["? Old"] } } as never);
    expect(keeper.isOutOfStep(wanted(QUESTIONS, session, LINES))).toBe(false);
  });
});
