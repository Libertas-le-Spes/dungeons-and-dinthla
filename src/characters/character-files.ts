import type { FileManager, TFile, Vault } from "obsidian";
import { charactersFolderOf } from "../campaign/campaign-folders";
import { PartlyWritten } from "../campaign/note-editor";
import { messageOf } from "../views/message-of";
import {
  newCharacterText,
  refusalForValues,
  trimmedEntry,
  valuesChanged,
  withEntryValues,
  type CharacterEntry,
} from "./character-entry";

export type CharacterVault = Pick<Vault, "getFiles" | "getFolderByPath" | "createFolder" | "create" | "process">;
export type CharacterFileManager = Pick<FileManager, "renameFile" | "trashFile">;

export const BAD_NAME = `A name can't hold any of \\ / : * ? " < > | # ^ [ ], or start with a dot.`;

const NOT_IN_A_NAME = /[\\/:*?"<>|#^[\]]/;

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

function nameClash(vault: CharacterVault, folder: string, name: string, ownPath: string | null): string | null {
  const wanted = `${folder}/${name}.md`.toLowerCase();
  const clash = vault.getFiles().find((file) => file.path.toLowerCase() === wanted && file.path !== ownPath);
  if (clash === undefined) return null;
  return `There is already a note called ${clash.basename} in ${folder}.`;
}

function refusalForName(vault: CharacterVault, folder: string, name: string, ownPath: string | null): string | null {
  if (NOT_IN_A_NAME.test(name) || name.startsWith(".")) return BAD_NAME;
  return nameClash(vault, folder, name, ownPath);
}

function refuseIfAny(refusal: string | null): void {
  if (refusal !== null) throw new Error(refusal);
}

export async function createCharacter(vault: CharacterVault, campaignFolder: string, entry: CharacterEntry): Promise<TFile | null> {
  const typed = trimmedEntry(entry);
  if (typed.name === "") return null;
  const folder = charactersFolderOf(campaignFolder);
  refuseIfAny(refusalForName(vault, folder, typed.name, null));
  refuseIfAny(refusalForValues(typed));
  if (vault.getFolderByPath(folder) === null) await vault.createFolder(folder);
  return vault.create(`${folder}/${typed.name}.md`, newCharacterText(typed));
}

async function writeValues(vault: CharacterVault, file: TFile, before: CharacterEntry, after: CharacterEntry): Promise<void> {
  let refusal: unknown = null;
  await vault.process(file, (text) => {
    try {
      return withEntryValues(text, file.path, before, after);
    } catch (error) {
      refusal = error;
      return text;
    }
  });
  if (refusal !== null) throw refusal;
}

export async function saveCharacter(
  vault: CharacterVault,
  fileManager: CharacterFileManager,
  file: TFile,
  before: CharacterEntry,
  entry: CharacterEntry,
): Promise<boolean> {
  const typed = trimmedEntry(entry);
  if (typed.name === "") return false;
  const folder = folderOf(file.path);
  const renamed = typed.name !== before.name;
  if (renamed) refuseIfAny(refusalForName(vault, folder, typed.name, file.path));
  refuseIfAny(refusalForValues(typed));
  const writes = valuesChanged(before, typed);
  if (writes) await writeValues(vault, file, before, typed);
  if (!renamed) return true;
  try {
    await fileManager.renameFile(file, `${folder}/${typed.name}.md`);
  } catch (error) {
    if (!writes) throw error;
    throw new PartlyWritten(`The values were saved, but the note couldn't be renamed: ${messageOf(error)}`);
  }
  return true;
}

export async function deleteCharacter(fileManager: CharacterFileManager, file: TFile): Promise<void> {
  await fileManager.trashFile(file);
}
