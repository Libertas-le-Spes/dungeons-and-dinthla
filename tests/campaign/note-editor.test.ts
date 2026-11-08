import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { CHANGED_IN_NOTE, NoteEditor, OLD_LINE_LEFT, PartlyWritten, type EditorVault, type Removal } from "../../src/campaign/note-editor";

class FakeNotes {
  readonly texts: Map<string, string>;
  afterRead: () => void = () => {};

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorVault {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => {
        const text = this.texts.get(file.path)!;
        this.afterRead();
        return text;
      },
    };
  }
}

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const OLD: Removal = { path: ONE, line: 1, matches: (written) => written === "!= Find it: done" };

describe("NoteEditor.replace across notes", () => {
  it("adds the new line in one note and removes the old line from another", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "" });
    await new NoteEditor(notes.vault).replace(TWO, ["!x Find it: lost"], OLD);
    expect(notes.texts.get(ONE)).toBe("! Find it\n");
    expect(notes.texts.get(TWO)).toBe("!x Find it: lost\n");
  });

  it("writes nothing when the old line changed before anything was written", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done, mostly\n", [TWO]: "" });
    await expect(new NoteEditor(notes.vault).replace(TWO, ["!x Find it: lost"], OLD)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("says the new line was written, leaving both, when the old one changed in between", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "" });
    notes.afterRead = () => notes.texts.set(ONE, "! Find it\n!= Find it: done, mostly\n");
    const replacing = new NoteEditor(notes.vault).replace(TWO, ["!x Find it: lost"], OLD);
    await expect(replacing).rejects.toBeInstanceOf(PartlyWritten);
    await expect(replacing).rejects.toThrow(OLD_LINE_LEFT);
    expect(notes.texts.get(TWO)).toBe("!x Find it: lost\n");
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done, mostly\n");
  });

  it("says plainly that nothing was written when only removing a line that changed in between", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "" });
    notes.afterRead = () => notes.texts.set(ONE, "! Find it\n!= Find it: done, mostly\n");
    await expect(new NoteEditor(notes.vault).replace(TWO, [], OLD)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(TWO)).toBe("");
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done, mostly\n");
  });

  it("keeps the old line when the note to write in has gone", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    await expect(new NoteEditor(notes.vault).replace(TWO, ["!x Find it: lost"], OLD)).rejects.toThrow("moved or deleted");
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done\n");
  });
});
