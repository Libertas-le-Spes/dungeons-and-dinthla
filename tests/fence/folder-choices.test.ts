import { describe, expect, it, vi } from "vitest";
import type { TAbstractFile, TFolder } from "obsidian";
import { NOT_THE_WHOLE_VAULT } from "../../src/fence/campaigns-folder-path";
import { A_FILE_HAS_THAT_NAME, FolderChoices, type FolderVault } from "../../src/fence/folder-choices";

function found(paths: string[], path: string): TAbstractFile | null {
  if (!paths.includes(path)) return null;
  return { path } as TAbstractFile;
}

function choicesWith(folders: string[], files: string[] = []) {
  const vault = {
    getAllFolders: vi.fn(() => folders.map((path) => ({ path }) as TFolder)),
    getFolderByPath: vi.fn((path: string) => found(folders, path)),
    getAbstractFileByPath: vi.fn((path: string) => found([...folders, ...files], path)),
    createFolder: vi.fn(async (path: string) => ({ path }) as TFolder),
  };
  return { choices: new FolderChoices(vault as unknown as FolderVault), vault };
}

describe("FolderChoices.folderPaths", () => {
  it("lists every folder by path in order, leaving out the vault itself", () => {
    const { choices, vault } = choicesWith(["Games/D&D", "D&D", "Recipes"]);
    expect(choices.folderPaths()).toEqual(["D&D", "Games/D&D", "Recipes"]);
    expect(vault.getAllFolders).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe("FolderChoices.make", () => {
  it("makes the folder typed and gives back its path", async () => {
    const { choices, vault } = choicesWith([]);
    await expect(choices.make(" Games/D&D ")).resolves.toBe("Games/D&D");
    expect(vault.createFolder).toHaveBeenCalledExactlyOnceWith("Games/D&D");
  });

  it("uses a folder that is already there without making it again", async () => {
    const { choices, vault } = choicesWith(["D&D"]);
    await expect(choices.make("D&D")).resolves.toBe("D&D");
    expect(vault.createFolder).not.toHaveBeenCalled();
  });

  it("refuses a name a file already has", async () => {
    const { choices, vault } = choicesWith([], ["D&D"]);
    await expect(choices.make("D&D")).rejects.toThrow(A_FILE_HAS_THAT_NAME);
    expect(vault.createFolder).not.toHaveBeenCalled();
  });

  it("refuses the whole vault", async () => {
    const { choices, vault } = choicesWith([]);
    await expect(choices.make("/")).rejects.toThrow(NOT_THE_WHOLE_VAULT);
    expect(vault.createFolder).not.toHaveBeenCalled();
  });
});
