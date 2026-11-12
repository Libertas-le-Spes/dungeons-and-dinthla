import { describe, expect, it } from "vitest";
import { PropertyWriter, WORDS_CHANGED, WORDS_CHANGED_AGAIN } from "../../src/note-keeping/property-writer";
import { FakeNotes } from "../kind-notes/fake-notes";

const PATH = "D&D/Pale Moon/Funds/Session 2.md";

describe("PropertyWriter", () => {
  it("changes the properties and leaves his words as they were", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words\r\n");
    await new PropertyWriter(notes.files, notes.actions).set(file, (properties) => {
      properties.lines = ["$ 5 gp"];
    });
    expect(notes.noteAt(PATH)?.properties).toEqual({ lines: ["$ 5 gp"] });
    expect(notes.noteAt(PATH)?.words).toBe("His words\r\n");
  });

  it("puts the note back as it was, and says so, when his words changed with the write", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words");
    notes.alsoChangeWords = "Other words";
    await expect(new PropertyWriter(notes.files, notes.actions).set(file, () => {})).rejects.toThrow(WORDS_CHANGED);
    expect(notes.noteAt(PATH)?.words).toBe("His words");
  });

  it("leaves the note as it is now, and says so, when it changed again before it could be put back", async () => {
    const notes = new FakeNotes();
    const file = notes.addNote(PATH, { lines: [] }, "His words");
    notes.alsoChangeWords = "Other words";
    notes.typedBeforePutBack = "Typed meanwhile";
    await expect(new PropertyWriter(notes.files, notes.actions).set(file, () => {})).rejects.toThrow(WORDS_CHANGED_AGAIN);
    expect(notes.noteAt(PATH)?.words).toBe("Typed meanwhile");
  });
});
