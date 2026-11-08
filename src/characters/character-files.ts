import { normalizePath, type FileManager, type TFile, type Vault } from "obsidian";
import { charactersFolderOf } from "../campaign/campaign-folders";
import { PartlyWritten } from "../campaign/note-editor";
import { messageOf } from "../views/message-of";
import { newCharacterText, refusalForValues, valuesChanged, withEntryValues, type CharacterEntry } from "./character-entry";

export type CharacterVault = Pick<Vault, "getFiles" | "getFolderByPath" | "createFolder" | "create" | "process">;
export type CharacterFileManager = Pick<FileManager, "renameFile" | "trashFile">;

export const BAD_NAME = `A name can't hold any of \\ / : * ? " < > | # ^ [ ] or a control character, or start or end with a dot or a space.`;
export const RESERVED_NAME =
  "CON, PRN, AUX, NUL, CONIN$, CONOUT$, COM0 to COM9 and LPT0 to LPT9, with COM¹ to COM³ and LPT¹ to LPT³, can't name a note on Windows, even with more after a dot.";
export const NOTE_MOVED = "The note was moved or renamed since the dialog opened, so nothing was written. Open the dialog again.";
export const LONG_NAME = "That name is too long for a note's file.";

const NOT_IN_A_NAME = /[\\/:*?"<>|#^[\]\u0000-\u001f\u007f]|^[. ]|[. ]$/;
const RESERVED_ON_WINDOWS = /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;
const MOST_FILE_NAME_BYTES = 255;

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

function notePathOf(folder: string, name: string): string {
  return normalizePath(`${folder}/${name}.md`);
}

function nameClash(vault: CharacterVault, folder: string, name: string, ownPath: string | null): string | null {
  const wanted = notePathOf(folder, name).toLowerCase();
  const clash = vault.getFiles().find((file) => file.path.toLowerCase() === wanted && file.path !== ownPath);
  if (clash === undefined) return null;
  return `There is already a note called ${clash.basename} in ${folder}.`;
}

function refusalForName(vault: CharacterVault, folder: string, name: string, ownPath: string | null): string | null {
  if (NOT_IN_A_NAME.test(name)) return BAD_NAME;
  if (RESERVED_ON_WINDOWS.test(name)) return RESERVED_NAME;
  if (new TextEncoder().encode(`${name}.md`).length > MOST_FILE_NAME_BYTES) return LONG_NAME;
  return nameClash(vault, folder, name, ownPath);
}

function refuseIfAny(refusal: string | null): void {
  if (refusal !== null) throw new Error(refusal);
}

export async function createCharacter(vault: CharacterVault, campaignFolder: string, entry: CharacterEntry): Promise<TFile | null> {
  if (entry.name === "") return null;
  const folder = charactersFolderOf(campaignFolder);
  refuseIfAny(refusalForName(vault, folder, entry.name, null));
  refuseIfAny(refusalForValues(entry));
  if (vault.getFolderByPath(folder) === null) await vault.createFolder(folder);
  return vault.create(notePathOf(folder, entry.name), newCharacterText(entry));
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
  openedPath: string,
  before: CharacterEntry,
  after: CharacterEntry,
): Promise<boolean> {
  if (after.name === "") return false;
  const folder = folderOf(file.path);
  const renamed = after.name !== before.name;
  if (renamed && file.path !== openedPath) throw new Error(NOTE_MOVED);
  if (renamed) refuseIfAny(refusalForName(vault, folder, after.name, file.path));
  refuseIfAny(refusalForValues(after));
  const writes = valuesChanged(before, after);
  if (writes) await writeValues(vault, file, before, after);
  if (!renamed) return true;
  try {
    await fileManager.renameFile(file, notePathOf(folder, after.name));
  } catch (error) {
    if (!writes) throw error;
    throw new PartlyWritten(`The values were saved, but the note couldn't be renamed: ${messageOf(error)}`);
  }
  return true;
}

export async function deleteCharacter(fileManager: CharacterFileManager, file: TFile): Promise<void> {
  await fileManager.trashFile(file);
}
