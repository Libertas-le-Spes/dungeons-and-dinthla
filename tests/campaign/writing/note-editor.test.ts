import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import {
  CHANGED_IN_NOTE,
  NoteEditor,
  OLD_LINE_LEFT,
  PartlyWritten,
  PROPERTIES_WOULD_CHANGE,
  WOULD_BE_HIDDEN,
  type EditorFiles,
  type Removal,
} from "../../../src/campaign/writing/note-editor";

class FakeNotes {
  readonly texts: Map<string, string>;
  afterRead: () => void = () => {};

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
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

describe("NoteEditor and a note's properties", () => {
  it("lets ordinary changes through in Windows notes without a final line break", async () => {
    const notes = new FakeNotes({ [ONE]: "---\r\na: 1\r\n---", [TWO]: "---\r\na: 1\r\n---\r\n? x" });
    const editor = new NoteEditor(notes.vault);
    await editor.append(ONE, ["? y"]);
    await editor.remove({ path: TWO, line: 3, matches: (written) => written === "? x" });
    expect(notes.texts.get(ONE)).toBe("---\r\na: 1\r\n---\r\n? y\r\n");
    expect(notes.texts.get(TWO)).toBe("---\r\na: 1\r\n---");
  });

  it("says the new line was written, leaving both, when the old note changed so removing would hide lines", async () => {
    const notes = new FakeNotes({ [ONE]: "!= Find it: done\nkeep\n", [TWO]: "" });
    notes.afterRead = () => notes.texts.set(ONE, "!= Find it: done\n---\nkeep\n---\n");
    const old: Removal = { path: ONE, line: 0, matches: (written) => written === "!= Find it: done" };
    const replacing = new NoteEditor(notes.vault).replace(TWO, ["!x Find it: lost"], old);
    await expect(replacing).rejects.toBeInstanceOf(PartlyWritten);
    await expect(replacing).rejects.toThrow(`The new line was written, but the old one was left: ${PROPERTIES_WOULD_CHANGE} Remove one of them by hand.`);
    expect(notes.texts.get(TWO)).toBe("!x Find it: lost\n");
    expect(notes.texts.get(ONE)).toBe("!= Find it: done\n---\nkeep\n---\n");
  });
});

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
    await expect(replacing).rejects.toMatchObject({ message: OLD_LINE_LEFT });
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

describe("NoteEditor.appendShown", () => {
  it("adds the lines at the end of the note", async () => {
    const notes = new FakeNotes({ [ONE]: "? x\n" });
    await new NoteEditor(notes.vault).appendShown(ONE, ["[[Mira]] AC: 15"]);
    expect(notes.texts.get(ONE)).toBe("? x\n[[Mira]] AC: 15\n");
  });

  it("writes nothing when the new line would land in a code block that never closes", async () => {
    const notes = new FakeNotes({ [ONE]: "```\ncode" });
    await expect(new NoteEditor(notes.vault).appendShown(ONE, ["[[Mira]] AC: 15"])).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("```\ncode");
  });

  it("writes nothing when the new line would land in a comment that never closes", async () => {
    const notes = new FakeNotes({ [ONE]: "%% a comment\n" });
    await expect(new NoteEditor(notes.vault).appendShown(ONE, ["[[Mira]] AC: 15"])).rejects.toThrow(WOULD_BE_HIDDEN);
    expect(notes.texts.get(ONE)).toBe("%% a comment\n");
  });

  it("adds a line after a code block that closes", async () => {
    const notes = new FakeNotes({ [ONE]: "```\ncode\n```" });
    await new NoteEditor(notes.vault).appendShown(ONE, ["[[Mira]] AC: 15"]);
    expect(notes.texts.get(ONE)).toBe("```\ncode\n```\n[[Mira]] AC: 15\n");
  });
});
