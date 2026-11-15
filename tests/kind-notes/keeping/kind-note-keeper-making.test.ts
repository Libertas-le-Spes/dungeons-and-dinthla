import { describe, expect, it } from "vitest";
import { FakeNotes } from "../fake-notes";
import { CAMPAIGN, FUNDS, keeperWith, QUESTIONS, SESSION, settled, wanted } from "../keeper-setup";

const LINES = ["? Who sent [[Lady Vess]] to the Old Mill", "?= Who is the pale woman: [[Mira]]'s sister"];

describe("KindNoteKeeper making a note", () => {
  it("makes a Questions note that links its session and holds the lines", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties).toEqual({ session: `[[${CAMPAIGN}/Sessions/Session 2]]`, lines: LINES });
    expect(notes.created).toEqual([QUESTIONS]);
  });

  it("makes the kind's folder first when it isn't there, and not when it is", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.folders.add(`${CAMPAIGN}/Funds`);
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES), wanted(FUNDS, session, ["$ 5 gp rooms"])]);
    await settled();
    expect(notes.foldersMade).toEqual([`${CAMPAIGN}/Questions`]);
  });

  it("makes the note empty first and writes the properties after, in one pass", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    expect(notes.files.create).toHaveBeenCalledExactlyOnceWith(QUESTIONS, "");
    expect(notes.actions.processFrontMatter).toHaveBeenCalledOnce();
    expect(notes.noteAt(QUESTIONS)?.words).toBe("");
  });

  it("makes nothing when the session has no line of that kind", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    keeperWith(notes).keep([wanted(QUESTIONS, session, [])]);
    await settled();
    expect(notes.created).toEqual([]);
    expect(notes.foldersMade).toEqual([]);
  });

  it("makes nothing when the session's own file can't be found to link to", async () => {
    const notes = new FakeNotes();
    keeperWith(notes).keep([wanted(QUESTIONS, null, LINES)]);
    await settled();
    expect(notes.created).toEqual([]);
  });

  it("links each campaign's note to its own session when two campaigns both have a Session 2", async () => {
    const notes = new FakeNotes();
    const mine = notes.addSession(SESSION);
    const other = notes.addSession("D&D/Dark Tide/Sessions/Session 2.md");
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, mine, LINES)]);
    keeper.keep([wanted("D&D/Dark Tide/Questions/Session 2.md", other, LINES, other.path)]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.session).toBe("[[D&D/Pale Moon/Sessions/Session 2]]");
    expect(notes.noteAt("D&D/Dark Tide/Questions/Session 2.md")?.properties?.session).toBe("[[D&D/Dark Tide/Sessions/Session 2]]");
  });

  it("says once, and tries again only when the lines change, when making a note fails", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.failProperties = new Error("disk full");
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    expect(notes.said).toEqual(["Couldn't write Questions for Session 2: disk full"]);
    expect(notes.actions.processFrontMatter).toHaveBeenCalledOnce();
  });

  it("writes the latest lines when two saves come one after the other, one write at a time", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    let release: () => void = () => {};
    notes.holdProperties = new Promise((resolve) => {
      release = resolve;
    });
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, ["? One"])]);
    await settled();
    keeper.keep([wanted(QUESTIONS, session, ["? One", "? Two"])]);
    await settled();
    notes.holdProperties = Promise.resolve();
    release();
    await settled();
    await settled();
    expect(notes.mostInside).toBe(1);
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? One", "? Two"]);
  });

  it("takes the empty note away again when its properties couldn't be written, so no half-made note is left", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.failProperties = new Error("disk full");
    keeperWith(notes).keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    expect(notes.trashed).toEqual([QUESTIONS]);
    expect(notes.noteAt(QUESTIONS)).toBeNull();
  });

  it("tries a failed note again when its lines change, and says nothing more if it works", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.failProperties = new Error("disk full");
    const keeper = keeperWith(notes);
    keeper.keep([wanted(QUESTIONS, session, LINES)]);
    await settled();
    notes.failProperties = null;
    keeper.keep([wanted(QUESTIONS, session, ["? Another"])]);
    await settled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Another"]);
    expect(notes.said).toHaveLength(1);
  });
});

describe("KindNoteKeeper making only what is missing", () => {
  it("makes a note that isn't there and says it did", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    await expect(keeperWith(notes).makeIfMissing(wanted(QUESTIONS, session, LINES))).resolves.toBe("made");
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(LINES);
  });

  it("leaves a note that is already there as it is, without reading it or writing to it", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.addNote(QUESTIONS, { session: "[[Session 2]]", lines: ["? Old"] }, "His words");
    await expect(keeperWith(notes).makeIfMissing(wanted(QUESTIONS, session, LINES))).resolves.toBe("left");
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
    expect(notes.files.create).not.toHaveBeenCalled();
    expect(notes.noteAt(QUESTIONS)?.properties?.lines).toEqual(["? Old"]);
  });

  it("makes nothing for a session with no line of that kind", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    await expect(keeperWith(notes).makeIfMissing(wanted(QUESTIONS, session, []))).resolves.toBe("left");
    expect(notes.created).toEqual([]);
  });

  it("says a failed make once and reports that nothing was made", async () => {
    const notes = new FakeNotes();
    const session = notes.addSession(SESSION);
    notes.failProperties = new Error("disk full");
    const keeper = keeperWith(notes);
    await expect(keeper.makeIfMissing(wanted(QUESTIONS, session, LINES))).resolves.toBe("failed");
    expect(notes.said).toEqual(["Couldn't write Questions for Session 2: disk full"]);
  });
});
