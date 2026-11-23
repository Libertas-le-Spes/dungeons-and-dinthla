import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { movedToTrash, notMovedToTrash, OldCharactersBases, type BasesNeeds } from "../../../src/characters/retiring/old-characters-bases";

const PALE_MOON = "D&D/Pale Moon";
const ASHEN_ROAD = "D&D/Ashen Road";

interface Setup {
  readonly files?: string[];
  readonly swept?: boolean;
  readonly chosen?: boolean;
  readonly refusing?: string[];
}

function sweepWith({ files = [], swept = false, chosen = true, refusing = [] }: Setup) {
  const told: string[] = [];
  const trashed: string[] = [];
  const keepSwept = vi.fn(async () => {});
  const needs: BasesNeeds = {
    mark: { swept: () => swept, keepSwept },
    campaignsFolderChosen: () => chosen,
    campaignFolders: () => [PALE_MOON, ASHEN_ROAD],
    fileAt: (path) => {
      if (!files.includes(path)) return null;
      return { path } as TFile;
    },
    trash: async (file) => {
      if (refusing.includes(file.path)) throw new Error("Read-only.");
      trashed.push(file.path);
    },
    tell: (words) => void told.push(words),
  };
  return { bases: new OldCharactersBases(needs), told, trashed, keepSwept };
}

describe("the old Characters.base files, dealt with once", () => {
  it("moves each campaign's Characters.base to the trash, says so for each, and remembers it was done", async () => {
    const { bases, told, trashed, keepSwept } = sweepWith({ files: [`${PALE_MOON}/Characters.base`, `${ASHEN_ROAD}/Characters.base`] });
    await bases.sweep();
    expect(trashed).toEqual([`${PALE_MOON}/Characters.base`, `${ASHEN_ROAD}/Characters.base`]);
    expect(told).toEqual([movedToTrash(PALE_MOON), movedToTrash(ASHEN_ROAD)]);
    expect(keepSwept).toHaveBeenCalledOnce();
  });

  it("touches no other file, a base of another name included", async () => {
    const { bases, trashed, told } = sweepWith({ files: [`${PALE_MOON}/Places.base`, `${PALE_MOON}/Characters/Characters.base`] });
    await bases.sweep();
    expect([trashed, told]).toEqual([[], []]);
  });

  it("remembers it was done when no campaign had one, saying nothing", async () => {
    const { bases, told, keepSwept } = sweepWith({});
    await bases.sweep();
    expect(told).toEqual([]);
    expect(keepSwept).toHaveBeenCalledOnce();
  });

  it("does nothing again once done, so a file put back from the trash stays", async () => {
    const { bases, trashed, keepSwept } = sweepWith({ files: [`${PALE_MOON}/Characters.base`], swept: true });
    await bases.sweep();
    expect(trashed).toEqual([]);
    expect(keepSwept).not.toHaveBeenCalled();
  });

  it("waits, remembering nothing, while no Campaigns folder is chosen", async () => {
    const { bases, trashed, keepSwept } = sweepWith({ files: [`${PALE_MOON}/Characters.base`], chosen: false });
    await bases.sweep();
    expect(trashed).toEqual([]);
    expect(keepSwept).not.toHaveBeenCalled();
  });

  it("says which it couldn't move, goes on with the others, and remembers it was done", async () => {
    const { bases, told, trashed, keepSwept } = sweepWith({ files: [`${PALE_MOON}/Characters.base`, `${ASHEN_ROAD}/Characters.base`], refusing: [`${PALE_MOON}/Characters.base`] });
    await bases.sweep();
    expect(trashed).toEqual([`${ASHEN_ROAD}/Characters.base`]);
    expect(told).toEqual([notMovedToTrash(PALE_MOON, new Error("Read-only.")), movedToTrash(ASHEN_ROAD)]);
    expect(keepSwept).toHaveBeenCalledOnce();
  });

  it("names the file and why in what it says", () => {
    expect(movedToTrash(PALE_MOON)).toBe("Moved D&D/Pale Moon/Characters.base to the trash: the Characters page no longer uses Bases.");
    expect(notMovedToTrash(PALE_MOON, new Error("Read-only."))).toBe("Couldn't move D&D/Pale Moon/Characters.base to the trash: Read-only. Delete it yourself if you don't need it.");
  });
});
