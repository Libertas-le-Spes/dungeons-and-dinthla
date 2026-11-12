import { describe, expect, it } from "vitest";
import { FakeNotes } from "../fake-notes";
import { keeperWith, QUESTIONS, SESSION, settled, wanted } from "../keeper-setup";

const OLD = ["? Who sent [[Lady Vess]]"];
const NEW = ["? Who sent [[Lady Vess]]", "?= Who sent [[Lady Vess]]: nobody"];
const HIS_WORDS = "My own words,\r\n  with odd   spacing\t\nand no newline at the end";

function noteWith(notes: FakeNotes, properties: Record<string, unknown>, words = HIS_WORDS): void {
  notes.addNote(QUESTIONS, properties, words);
}

describe("KindNoteKeeper updating a note", () => {
  it("sets the lines when they differ from the session's", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(NEW);
  });

  it("writes nothing when the lines already match", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: NEW });
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
    expect(notes.files.process).not.toHaveBeenCalled();
  });

  it("keeps his words below the properties byte for byte", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.words).toBe(HIS_WORDS);
  });

  it("changes only the lines property and leaves his own properties in place", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", tags: ["pale"], lines: OLD });
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: "[[Session 2]]", tags: ["pale"], lines: NEW });
  });

  it("puts the note back as it was and says so when his words change while it writes", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    notes.alsoChangeWords = "Something else";
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.words).toBe(HIS_WORDS);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(OLD);
    expect(notes.said).toEqual(["Couldn't write Questions for Session 2: its own words changed while its properties were written, so the note was put back as it was."]);
  });

  it("sets the lines of a note whose lines property isn't a list, since the session link says it is the plugin's", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: "not a list" });
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(NEW);
  });

  it("writes again when a later save changes the lines, and not when it doesn't", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.actions.processFrontMatter).toHaveBeenCalledOnce();
    keeper.keep([wanted(QUESTIONS, session, OLD)]);
    await settled();
    expect(notes.actions.processFrontMatter).toHaveBeenCalledTimes(2);
  });

  it("leaves his typing alone, and says so, when he typed again after the note was written and before it was put back", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    notes.alsoChangeWords = "Something else";
    notes.typedBeforePutBack = "What he typed meanwhile";
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.words).toBe("What he typed meanwhile");
    expect(notes.said).toEqual(["Couldn't write Questions for Session 2: its own words changed while its properties were written, and again after, so the note was left as it is now."]);
  });

  it("tries lines again that failed before when the lines come back to them after other lines were written", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    const keeper = keeperWith(notes);
    notes.failProperties = new Error("disk full");
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    notes.failProperties = null;
    keeper.keep([wanted(QUESTIONS, session, ["? Another"])]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(NEW);
  });

  it("tries failed lines again after the session went back to what the note holds and then to the failed lines", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    const keeper = keeperWith(notes);
    notes.failProperties = new Error("disk full");
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    notes.failProperties = null;
    keeper.keep([wanted(QUESTIONS, session, OLD)]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(NEW);
  });
});
