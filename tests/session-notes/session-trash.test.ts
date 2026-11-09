import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { SESSION_GONE } from "../../src/session-notes/session-clearer";
import { CHANGED_SINCE_ASKED_TO_DELETE, SessionTrash } from "../../src/session-notes/session-trash";
import { BOM, FakeNotes } from "../note-editing/fake-notes";

const PATH = "Pale Moon/Sessions/Session 12.md";
const NOTE = "Tracks\n? Who";

function trashOn(text: string | null) {
  const notes = new FakeNotes(PATH, text);
  const fileManager = { trashFile: vi.fn(async (_file: TFile) => {}) };
  return { trash: new SessionTrash(notes.vault, fileManager, () => false), notes, fileManager };
}

describe("SessionTrash", () => {
  it("keeps the note and its text as the box reads it when asking", async () => {
    const { trash, notes } = trashOn(`${BOM}Tracks\r\n? Who`);
    const asked = await trash.ask(PATH);
    expect(asked).toEqual({ file: notes.vault.getFileByPath(PATH), text: NOTE });
  });

  it("has nothing to ask about when the note is gone", async () => {
    const { trash } = trashOn(null);
    expect(await trash.ask(PATH)).toBeNull();
  });

  it("hands the note asked about to Obsidian's trash when it is unchanged", async () => {
    const { trash, fileManager } = trashOn(NOTE);
    const asked = (await trash.ask(PATH))!;
    await trash.trash(PATH, asked);
    expect(fileManager.trashFile).toHaveBeenCalledExactlyOnceWith(asked.file);
  });

  it("trashes nothing and says so when the note's text changed since asking", async () => {
    const { trash, notes, fileManager } = trashOn(NOTE);
    const asked = (await trash.ask(PATH))!;
    notes.text = `${NOTE}\n! Ride to Thessaly`;
    await expect(trash.trash(PATH, asked)).rejects.toThrow(CHANGED_SINCE_ASKED_TO_DELETE);
    expect(fileManager.trashFile).not.toHaveBeenCalled();
  });

  it("trashes nothing and says so when another note now has the path, even with the same text", async () => {
    const { trash, notes, fileManager } = trashOn(NOTE);
    const asked = (await trash.ask(PATH))!;
    notes.makeAgain(NOTE);
    await expect(trash.trash(PATH, asked)).rejects.toThrow(CHANGED_SINCE_ASKED_TO_DELETE);
    expect(fileManager.trashFile).not.toHaveBeenCalled();
  });

  it("says the note is gone and trashes nothing", async () => {
    const { trash, notes, fileManager } = trashOn(NOTE);
    const asked = (await trash.ask(PATH))!;
    notes.text = null;
    await expect(trash.trash(PATH, asked)).rejects.toThrow(SESSION_GONE);
    expect(fileManager.trashFile).not.toHaveBeenCalled();
  });
});
