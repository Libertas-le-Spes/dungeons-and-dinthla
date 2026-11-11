import { describe, expect, it, vi } from "vitest";
import type { TAbstractFile, TFolder } from "obsidian";
import { NOT_A_HIDDEN_FOLDER, NOT_THE_CONFIG_FOLDER, NOT_THE_WHOLE_VAULT } from "../../../src/fence/paths/campaigns-folder-path";
import { A_FILE_HAS_THAT_NAME, FolderChoices, type FolderVault } from "../../../src/fence/gate/folder-choices";

function found(paths: string[], path: string): TAbstractFile | null {
  if (!paths.includes(path)) return null;
  return { path } as TAbstractFile;
}

function choicesWith(folders: string[], files: string[] = [], configDir = ".obsidian") {
  const vault = {
    configDir,
    getAllFolders: vi.fn(() => folders.map((path) => ({ path }) as TFolder)),
    getFolderByPath: vi.fn((path: string) => found(folders, path)),
    getAbstractFileByPath: vi.fn((path: string) => found([...folders, ...files], path)),
    createFolder: vi.fn(async (path: string) => ({ path }) as TFolder),
  };
  return { choices: new FolderChoices(vault as unknown as FolderVault), vault };
}

describe("FolderChoices.folderPaths", () => {
  it("lists every folder by path in order, leaving out the vault itself", () => {
    const { choices, vault } = choicesWith(["/", "Games/D&D", "D&D", "Recipes"]);
    expect(choices.folderPaths()).toEqual(["D&D", "Games/D&D", "Recipes"]);
    expect(vault.getAllFolders).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("lists a folder the vault holds in decomposed letters or with a no-break space", () => {
    const { choices } = choicesWith(["Zoe\u0308", "Pale\u00a0Moon"]);
    expect(choices.folderPaths()).toEqual(["Pale\u00a0Moon", "Zoe\u0308"]);
  });

  it("leaves out hidden folders, the vault's settings folder and the folders inside them", () => {
    const { choices } = choicesWith([".obsidian", ".obsidian/plugins", "Games/.hidden", "D&D"]);
    expect(choices.folderPaths()).toEqual(["D&D"]);
  });

  it("leaves out the vault's settings folder even when its name has no dot", () => {
    const { choices } = choicesWith(["Vault Settings", "Vault Settings/plugins", "D&D"], [], "Vault Settings");
    expect(choices.folderPaths()).toEqual(["D&D"]);
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

  it("refuses a hidden folder, such as the vault's settings folder", async () => {
    const { choices, vault } = choicesWith([".obsidian"]);
    await expect(choices.make(".obsidian")).rejects.toThrow(NOT_A_HIDDEN_FOLDER);
    expect(vault.createFolder).not.toHaveBeenCalled();
  });

  it("refuses the vault's settings folder even when its name has no dot", async () => {
    const { choices, vault } = choicesWith(["Vault Settings"], [], "Vault Settings");
    await expect(choices.make("Vault Settings/D&D")).rejects.toThrow(NOT_THE_CONFIG_FOLDER);
    expect(vault.createFolder).not.toHaveBeenCalled();
  });
});
