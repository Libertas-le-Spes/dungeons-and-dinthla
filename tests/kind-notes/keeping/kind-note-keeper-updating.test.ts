import { describe, expect, it } from "vitest";
import { FakeNotes } from "../fake-notes";
import { CAMPAIGN, FUNDS, keeperWith, QUESTIONS, SESSION, settled, wanted } from "../keeper-setup";

const QUESTS = `${CAMPAIGN}/Quests/Session 2.md`;

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

  it("sets the lines of a note an earlier version linked by the short name, though notes of the same number are beside it", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    notes.addNote(FUNDS, { session: "[[Session 2]]", lines: [] }, "");
    notes.addNote(QUESTS, { session: "[[Session 2]]", lines: [] }, "");
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(NEW);
    expect(notes.said).toEqual([]);
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

  it("leaves his words as they are now, with what he added, and says so, when they change while it writes", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    noteWith(notes, { session: "[[Session 2]]", lines: OLD });
    notes.alsoChangeWords = `${HIS_WORDS} and what he added`;
    keeperWith(notes).keep([wanted(QUESTIONS, session, NEW)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.words).toBe(`${HIS_WORDS} and what he added`);
    expect(notes.said).toEqual(["Couldn't write Questions for Session 2: its own words changed while its properties were written, so the note was left as it is now. Look at it."]);
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
