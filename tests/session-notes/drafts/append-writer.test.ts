import { describe, expect, it, vi } from "vitest";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { fileAt } from "../../stubs/note-files";
import { PROPERTIES_WOULD_CHANGE, type EditorFiles } from "../../../src/campaign/writing/note-editor";
import { AppendWriter } from "../../../src/session-notes/drafts/append-writer";

const PATH = "Pale Moon/Sessions/Session 12.md";
const NOTE = fileAt(PATH);

function vaultHolding(text: string, { gone = false } = {}) {
  const written: string[] = [];
  const vault = {
    note: vi.fn((path: string) => {
      if (gone || path !== PATH) return null;
      return NOTE;
    }),
    change: vi.fn(async (_file: NoteRef, change: (data: string) => string) => {
      const next = change(text);
      written.push(next);
      return next;
    }),
    read: vi.fn(),
  };
  return { vault, written, editorVault: vault as unknown as EditorFiles };
}

describe("AppendWriter", () => {
  it("adds the box's lines at the end of the note inside one Vault.process, keeping every line already there", async () => {
    const before = "---\nplayed: 2026-11-09\n---\n? Who sent the letter\nTracks lead north";
    const { vault, written, editorVault } = vaultHolding(before);
    const left = await new AppendWriter(editorVault).save(PATH, "  ! Find the caravan  \n?? letter\n\n$ 20 gp from Lady Vess");
    expect(vault.change).toHaveBeenCalledExactlyOnceWith(NOTE, expect.any(Function));
    expect(written).toEqual([`${before}\n! Find the caravan\n$ 20 gp from Lady Vess\n`]);
    expect(left).toBe("?? letter");
  });

  it("adds after a note that ends with a line break without a blank line between", async () => {
    const { written, editorVault } = vaultHolding("? Who\n");
    await new AppendWriter(editorVault).save(PATH, "Tracks lead north");
    expect(written).toEqual(["? Who\nTracks lead north\n"]);
  });

  it("writes nothing when the box holds only lookups", async () => {
    const { vault, editorVault } = vaultHolding("? Who\n");
    expect(await new AppendWriter(editorVault).save(PATH, "?? who\n")).toBe("?? who");
    expect(vault.change).not.toHaveBeenCalled();
  });

  it("refuses when the session note is gone, writing nothing", async () => {
    const { vault, editorVault } = vaultHolding("? Who", { gone: true });
    await expect(new AppendWriter(editorVault).save(PATH, "? Who")).rejects.toThrow(`${PATH} was moved or deleted`);
    expect(vault.change).not.toHaveBeenCalled();
  });

  it("refuses, leaving the note as it was, when the lines would turn into its properties", async () => {
    const { written, editorVault } = vaultHolding("---\nplayed: 2026-11-09");
    await expect(new AppendWriter(editorVault).save(PATH, "---")).rejects.toThrow(PROPERTIES_WOULD_CHANGE);
    expect(written).toEqual(["---\nplayed: 2026-11-09"]);
  });
});
