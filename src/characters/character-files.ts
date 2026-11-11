import { normalizePath, type TFile } from "obsidian";
import { referenceFolderOf } from "../campaign/campaign-folders";
import { characterReferenceKind } from "../kinds/character-reference-kind";
import { refusalForFileName } from "../names/file-name";
import { nameKeyOf } from "../names/name-key";
import { PartlyWritten } from "../campaign/note-editor";
import { messageOf } from "../views/message-of";
import { newCharacterText, refusalForValues, valuesChanged, withEntryValues, type CharacterEntry } from "./character-entry";
import type { FencedFileActions } from "../fence/fenced-file-actions";
import type { FencedFiles } from "../fence/fenced-files";

export type CharacterFiles = Pick<FencedFiles, "getFiles" | "getFolderByPath" | "createFolder" | "create" | "process">;
export type CharacterFileActions = Pick<FencedFileActions, "renameFile" | "trashFile">;

export const NOTE_MOVED = "The note was moved or renamed since the dialog opened, so nothing was written. Open the dialog again.";

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

function notePathOf(folder: string, name: string): string {
  return normalizePath(`${folder}/${name}.md`);
}

function nameClash(files: CharacterFiles, folder: string, name: string, ownPath: string | null): string | null {
  const wanted = nameKeyOf(notePathOf(folder, name));
  const clash = files.getFiles().find((file) => nameKeyOf(file.path) === wanted && file.path !== ownPath);
  if (clash === undefined) return null;
  return `There is already a note called ${clash.basename} in ${folder}.`;
}

function refusalForName(files: CharacterFiles, folder: string, name: string, ownPath: string | null): string | null {
  const refusal = refusalForFileName(name);
  if (refusal !== null) return refusal;
  return nameClash(files, folder, name, ownPath);
}

function refuseIfAny(refusal: string | null): void {
  if (refusal !== null) throw new Error(refusal);
}

export async function createCharacter(files: CharacterFiles, campaignFolder: string, entry: CharacterEntry): Promise<TFile | null> {
  if (entry.name === "") return null;
  const folder = referenceFolderOf(characterReferenceKind, campaignFolder);
  refuseIfAny(refusalForName(files, folder, entry.name, null));
  refuseIfAny(refusalForValues(entry));
  if (files.getFolderByPath(folder) === null) await files.createFolder(folder);
  return files.create(notePathOf(folder, entry.name), newCharacterText(entry));
}

export async function writeOverrides(files: Pick<FencedFiles, "process">, file: TFile, change: (text: string) => string): Promise<void> {
  let refusal: unknown = null;
  await files.process(file, (text) => {
    try {
      return change(text);
    } catch (error) {
      refusal = error;
      return text;
    }
  });
  if (refusal !== null) throw refusal;
}

export async function saveCharacter(
  files: CharacterFiles,
  actions: CharacterFileActions,
  file: TFile,
  openedPath: string,
  before: CharacterEntry,
  after: CharacterEntry,
): Promise<boolean> {
  if (after.name === "") return false;
  const folder = folderOf(file.path);
  const renamed = after.name !== before.name;
  if (renamed && file.path !== openedPath) throw new Error(NOTE_MOVED);
  if (renamed) refuseIfAny(refusalForName(files, folder, after.name, file.path));
  refuseIfAny(refusalForValues(after));
  const writes = valuesChanged(before, after);
  if (writes) await writeOverrides(files, file, (text) => withEntryValues(text, file.path, before, after));
  if (!renamed) return true;
  try {
    await actions.renameFile(file, notePathOf(folder, after.name));
  } catch (error) {
    if (!writes) throw error;
    throw new PartlyWritten(`The values were saved, but the note couldn't be renamed: ${messageOf(error)}`);
  }
  return true;
}

export async function deleteCharacter(actions: CharacterFileActions, file: TFile): Promise<void> {
  await actions.trashFile(file);
}
