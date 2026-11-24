import { describe, expect, it } from "vitest";
import { PropertyWriter, WORDS_CHANGED } from "../../src/note-keeping/property-writer";
import { FakeNotes } from "../kind-notes/fake-notes";
import { STUB_SYNTAX } from "../host/stub-syntax";

const PATH = "D&D/Pale Moon/Funds/Session 2.md";

function writerOver(notes: FakeNotes): PropertyWriter {
  const host = notes.host();
  return new PropertyWriter(host.store, host.keeping, STUB_SYNTAX);
}

describe("PropertyWriter", () => {
  it("changes the properties and leaves his words as they were", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words\r\n");
    await writerOver(notes).set(file, (properties) => {
      properties.lines = ["$ 5 gp"];
    });
    expect(notes.noteAt(PATH)?.properties).toEqual({ lines: ["$ 5 gp"] });
    expect(notes.noteAt(PATH)?.words).toBe("His words\r\n");
  });

  it("leaves the note as it is, with what he added, and says so, when his words changed with the write", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words");
    notes.alsoChangeWords = "His words, and what he added meanwhile";
    await expect(writerOver(notes).set(file, () => {})).rejects.toThrow(WORDS_CHANGED);
    expect(notes.noteAt(PATH)?.words).toBe("His words, and what he added meanwhile");
  });

  it("never rewrites the note's text itself", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words");
    notes.alsoChangeWords = "Other";
    await expect(writerOver(notes).set(file, () => {})).rejects.toThrow();
    expect(notes.files.process).not.toHaveBeenCalled();
  });
});
