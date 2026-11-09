import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { SESSION_GONE } from "../../src/session-notes/session-clearer";
import { SessionTrash } from "../../src/session-notes/session-trash";

const PATH = "Pale Moon/Sessions/Session 12.md";

function trashWith(file: TFile | null) {
  const vault = { getFileByPath: vi.fn(() => file) };
  const fileManager = { trashFile: vi.fn(async () => {}) };
  return { trash: new SessionTrash(vault, fileManager), vault, fileManager };
}

describe("SessionTrash", () => {
  it("hands the session's note to Obsidian's trash, as Obsidian is set to use", async () => {
    const note = { path: PATH } as TFile;
    const { trash, vault, fileManager } = trashWith(note);
    await trash.trash(PATH);
    expect(vault.getFileByPath).toHaveBeenCalledExactlyOnceWith(PATH);
    expect(fileManager.trashFile).toHaveBeenCalledExactlyOnceWith(note);
  });

  it("says the note is gone and trashes nothing", async () => {
    const { trash, fileManager } = trashWith(null);
    await expect(trash.trash(PATH)).rejects.toThrow(SESSION_GONE);
    expect(fileManager.trashFile).not.toHaveBeenCalled();
  });
});
