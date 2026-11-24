import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { NOTE_CHANGED, NOTE_GONE, NoteChangedSince, NoteSaver, type SaverFiles } from "../../src/note-editing/note-saver";

const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const FILE = { path: OLD_MILL } as TFile;

function vaultHolding(text: string | null) {
  const written: string[] = [];
  const process = vi.fn(async (_file: TFile, change: (now: string) => string) => {
    written.push(change(String(text)));
    return written[0]!;
  });
  const getFileByPath = vi.fn((path: string) => {
    if (text === null || path !== OLD_MILL) return null;
    return FILE;
  });
  const vault: SaverFiles = { note: getFileByPath, change: process };
  return { vault, process, written };
}

describe("NoteSaver", () => {
  it("writes the box's text in one change of the note when the note still reads as it was loaded", async () => {
    const { vault, process, written } = vaultHolding("The wheel turns.");
    await new NoteSaver(vault).save(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns at night." });
    expect(process).toHaveBeenCalledOnce();
    expect(process.mock.calls[0]![0]).toBe(FILE);
    expect(written).toEqual(["The wheel turns at night."]);
  });

  it("writes nothing over a change made to the note since it was loaded, and says so", async () => {
    const { vault, written } = vaultHolding("The wheel turns. Mira saw it.");
    const saving = new NoteSaver(vault).save(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns at night." });
    await expect(saving).rejects.toThrow(NoteChangedSince);
    await expect(saving).rejects.toThrow(NOTE_CHANGED);
    expect(written).toEqual(["The wheel turns. Mira saw it."]);
  });

  it("saves a note that starts with a byte order mark, and keeps the mark", async () => {
    const { vault, written } = vaultHolding("\uFEFFThe wheel turns.");
    await new NoteSaver(vault).save(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns at night." });
    expect(written).toEqual(["\uFEFFThe wheel turns at night."]);
  });

  it("saves a note with Windows line endings, and keeps them", async () => {
    const { vault, written } = vaultHolding("The wheel turns.\r\nRain.\r\n");
    await new NoteSaver(vault).save(OLD_MILL, { base: "The wheel turns.\nRain.\n", text: "The wheel turns.\nRain at night.\n" });
    expect(written).toEqual(["The wheel turns.\r\nRain at night.\r\n"]);
  });

  it("writes nothing to a note that is gone, and says so", async () => {
    const { vault, process } = vaultHolding(null);
    await expect(new NoteSaver(vault).save(OLD_MILL, { base: "", text: "Lady Vess" })).rejects.toThrow(NOTE_GONE);
    expect(process).not.toHaveBeenCalled();
  });
});
