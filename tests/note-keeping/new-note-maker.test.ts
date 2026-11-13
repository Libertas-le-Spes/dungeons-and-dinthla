import { describe, expect, it } from "vitest";
import { NewNoteMaker } from "../../src/note-keeping/new-note-maker";
import { FakeNotes } from "../kind-notes/fake-notes";

const PATH = "D&D/Pale Moon/Funds/Session 2.md";

function makerWith(notes: FakeNotes): NewNoteMaker {
  return new NewNoteMaker(notes.files, notes.actions);
}

describe("NewNoteMaker", () => {
  it("makes the folder when it isn't there, then an empty note, then writes its properties", async () => {
    const notes = new FakeNotes();
    await makerWith(notes).make(PATH, (properties) => {
      properties.lines = ["$ 5 gp"];
    });
    expect(notes.foldersMade).toEqual(["D&D/Pale Moon/Funds"]);
    expect(notes.files.create).toHaveBeenCalledExactlyOnceWith(PATH, "");
    expect(notes.noteAt(PATH)?.properties).toEqual({ lines: ["$ 5 gp"] });
  });

  it("doesn't make a folder that is there", async () => {
    const notes = new FakeNotes();
    notes.folders.add("D&D/Pale Moon/Funds");
    await makerWith(notes).make(PATH, () => {});
    expect(notes.foldersMade).toEqual([]);
  });

  it("takes the empty note away again, and tells why, when the properties couldn't be written", async () => {
    const notes = new FakeNotes();
    notes.failProperties = new Error("disk full");
    await expect(makerWith(notes).make(PATH, () => {})).rejects.toThrow("disk full");
    expect(notes.trashed).toEqual([PATH]);
  });

  it("tells why even when taking the note away fails too", async () => {
    const notes = new FakeNotes();
    notes.failProperties = new Error("disk full");
    notes.actions.trashFile.mockRejectedValueOnce(new Error("can't trash"));
    await expect(makerWith(notes).make(PATH, () => {})).rejects.toThrow("disk full");
  });

  it("trashes a note that holds only the plugin's properties and no words, and says it did", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { session: "[[Session 2]]", lines: [] }, " \n");
    await expect(makerWith(notes).trashIfNothingOfHis(file)).resolves.toBe(true);
    expect(notes.trashed).toEqual([PATH]);
  });

  it("keeps a note with words, or with a property of his, and says it did", async () => {
    const notes = new FakeNotes();
    const withWords = notes.addNote(PATH, { lines: [] }, "His words");
    const withProperty = notes.addNote(`${PATH}.x.md`, { lines: [], tags: ["pale"] }, "");
    await expect(makerWith(notes).trashIfNothingOfHis(withWords)).resolves.toBe(false);
    await expect(makerWith(notes).trashIfNothingOfHis(withProperty)).resolves.toBe(false);
    expect(notes.trashed).toEqual([]);
  });
});
