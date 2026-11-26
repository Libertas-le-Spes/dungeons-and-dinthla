import { parentFolderOf } from "../../campaign/paths/note-name";
import { referenceFolderOf } from "../../campaign/paths/campaign-folders";
import { fallenNoteOf, leftPlayWords } from "../../campaign/paths/fallen-notes";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { refusalForFileName } from "../../names/file-name";
import { nameKeyOf } from "../../names/name-key";
import { PartlyWritten } from "../../campaign/writing/note-editor";
import { messageOf } from "../../views/dialogs/message-of";
import { newCharacterText, refusalForValues, valuesChanged, withEntryValues, type CharacterEntry } from "./character-entry";
import type { NoteKeeping } from "../../host/notes/note-keeping";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import type { PathSpelling } from "../../host/rules/path-spelling";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export interface CharacterFiles {
  readonly store: Pick<NoteStore, "files" | "hasFolder" | "makeFolder" | "make" | "change">;
  readonly spelling: PathSpelling;
}

export type CharacterFileActions = Pick<NoteKeeping, "moveWithLinks" | "throwAway">;

export const NOTE_MOVED = "The note was moved or renamed since the dialog opened, so nothing was written. Open the dialog again.";

function notePathOf(files: CharacterFiles, folder: string, name: string): string {
  return files.spelling.storedSpellingOf(`${folder}/${name}.md`);
}

function nameClash(files: CharacterFiles, folder: string, name: string, ownPath: string | null): string | null {
  const wanted = nameKeyOf(notePathOf(files, folder, name));
  const clash = files.store.files().find((file) => nameKeyOf(file.path) === wanted && file.path !== ownPath);
  if (clash === undefined) return null;
  return `There is already a note called ${clash.basename} in ${folder}.`;
}

function refusalForName(files: CharacterFiles, folder: string, name: string, ownPath: string | null): string | null {
  const refusal = refusalForFileName(name);
  if (refusal !== null) return refusal;
  return nameClash(files, folder, name, ownPath);
}

function refusalForFallen(files: CharacterFiles, campaignFolder: string, name: string): string | null {
  if (fallenNoteOf(files.store.files(), campaignFolder, name) === null) return null;
  return leftPlayWords(name);
}

function refuseIfAny(refusal: string | null): void {
  if (refusal !== null) throw new Error(refusal);
}

export async function createCharacter(files: CharacterFiles, campaignFolder: string, entry: CharacterEntry): Promise<NoteRef | null> {
  if (entry.name === "") return null;
  const folder = referenceFolderOf(characterReferenceKind, campaignFolder);
  refuseIfAny(refusalForName(files, folder, entry.name, null));
  refuseIfAny(refusalForFallen(files, campaignFolder, entry.name));
  refuseIfAny(refusalForValues(entry));
  if (!files.store.hasFolder(folder)) await files.store.makeFolder(folder);
  return files.store.make(notePathOf(files, folder, entry.name), newCharacterText(entry));
}

export async function writeOverrides(store: Pick<NoteStore, "change">, file: NoteRef, change: (text: string) => string): Promise<void> {
  let refusal: unknown = null;
  await store.change(file, (text) => {
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
  campaignFolder: string,
  file: NoteRef,
  openedPath: string,
  before: CharacterEntry,
  after: CharacterEntry,
  syntax: PropertiesSyntax,
): Promise<boolean> {
  if (after.name === "") return false;
  const folder = parentFolderOf(file.path);
  const renamed = after.name !== before.name;
  if (renamed && file.path !== openedPath) throw new Error(NOTE_MOVED);
  if (renamed) refuseIfAny(refusalForName(files, folder, after.name, file.path));
  if (renamed) refuseIfAny(refusalForFallen(files, campaignFolder, after.name));
  refuseIfAny(refusalForValues(after));
  const writes = valuesChanged(before, after);
  if (writes) await writeOverrides(files.store, file, (text) => withEntryValues(text, file.path, before, after, syntax));
  if (!renamed) return true;
  try {
    await actions.moveWithLinks(file, notePathOf(files, folder, after.name));
  } catch (error) {
    if (!writes) throw error;
    throw new PartlyWritten(`The values were saved, but the note couldn't be renamed: ${messageOf(error)}`);
  }
  return true;
}

export async function deleteCharacter(actions: CharacterFileActions, file: NoteRef): Promise<void> {
  await actions.throwAway(file);
}
