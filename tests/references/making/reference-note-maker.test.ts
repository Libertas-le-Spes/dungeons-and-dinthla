import { describe, expect, it, vi } from "vitest";
import { ReferenceNoteMaker } from "../../../src/references/making/reference-note-maker";
import type { PlannedReferenceNote } from "../../../src/references/making/reference-note-plan";
import { FakeNotes } from "../../kind-notes/fake-notes";
import { CAMPAIGN } from "../../stubs/note-files";

const SESSION_PATH = `${CAMPAIGN}/Sessions/Session 1.md`;
const NOTE_PATH = `${CAMPAIGN}/Characters/Lady Vess.md`;

const PLANNED: PlannedReferenceNote = {
  name: "Lady Vess",
  kind: "character",
  path: NOTE_PATH,
  firstSession: { path: SESSION_PATH, number: 1, text: "", firstLine: 0 },
};

function makerWith(notes: FakeNotes) {
  const failed = vi.fn();
  const maker = new ReferenceNoteMaker({ files: notes.files, metadata: notes.metadata, actions: notes.actions, failed });
  return { maker, failed };
}

function notesWithSession(): FakeNotes {
  const notes = new FakeNotes();
  notes.addSession(SESSION_PATH);
  return notes;
}

describe("ReferenceNoteMaker", () => {
  it("makes the note holding the one property, first named, linking the session", async () => {
    const notes = notesWithSession();
    const { maker } = makerWith(notes);
    expect(await maker.make(PLANNED)).toBe("made");
    expect(notes.created).toEqual([NOTE_PATH]);
    expect(notes.noteAt(NOTE_PATH)?.properties).toEqual({ "first named": "[[Session 1]]" });
    expect(notes.noteAt(NOTE_PATH)?.words).toBe("");
  });

  it("makes the folder when it is missing", async () => {
    const notes = notesWithSession();
    await makerWith(notes).maker.make(PLANNED);
    expect(notes.foldersMade).toEqual([`${CAMPAIGN}/Characters`]);
  });

  it("links a session of the same name in another campaign by its path, as Obsidian words it", async () => {
    const notes = notesWithSession();
    notes.addSession("D&D/Other Moon/Sessions/Session 1.md");
    await makerWith(notes).maker.make(PLANNED);
    expect(notes.noteAt(NOTE_PATH)?.properties).toEqual({ "first named": `[[${CAMPAIGN}/Sessions/Session 1]]` });
  });

  it("leaves a note that is already there exactly as it is, and writes nothing", async () => {
    const notes = notesWithSession();
    notes.addNote(NOTE_PATH, { class: "wizard" }, "His own words.");
    const { maker } = makerWith(notes);
    expect(await maker.make(PLANNED)).toBe("left");
    expect(notes.created).toEqual([]);
    expect(notes.propertyWrites).toEqual([]);
    expect(notes.processed).toEqual([]);
    expect(notes.trashed).toEqual([]);
    expect(notes.noteAt(NOTE_PATH)?.properties).toEqual({ class: "wizard" });
    expect(notes.noteAt(NOTE_PATH)?.words).toBe("His own words.");
  });

  it("makes nothing when the session it was first named in is gone", async () => {
    const notes = new FakeNotes();
    const { maker } = makerWith(notes);
    expect(await maker.make(PLANNED)).toBe("left");
    expect(notes.created).toEqual([]);
  });

  it("makes it once when asked twice at the same time", async () => {
    const notes = notesWithSession();
    const { maker } = makerWith(notes);
    const results = await Promise.all([maker.make(PLANNED), maker.make(PLANNED)]);
    expect(results).toEqual(["made", "left"]);
    expect(notes.created).toEqual([NOTE_PATH]);
  });

  it("says it failed, and leaves no empty note behind, when the property can't be written", async () => {
    const notes = notesWithSession();
    notes.failProperties = new Error("disk full");
    const { maker, failed } = makerWith(notes);
    expect(await maker.make(PLANNED)).toBe("failed");
    expect(failed).toHaveBeenCalledWith(PLANNED, notes.failProperties);
    expect(notes.noteAt(NOTE_PATH)).toBeNull();
  });
});
