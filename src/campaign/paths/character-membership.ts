import type { NoteRef } from "../../host/notes/note-ref";
import { charactersFolderOf, fallenNotePathOf } from "./campaign-folders";

export function charactersNotePathOf(campaignFolder: string, name: string): string {
  return `${charactersFolderOf(campaignFolder)}/${name}.md`;
}

export function isInCharacters(file: NoteRef, campaignFolder: string): boolean {
  return file.path === charactersNotePathOf(campaignFolder, file.basename);
}

export function isInFallen(file: NoteRef, campaignFolder: string): boolean {
  return file.path === fallenNotePathOf(campaignFolder, file.basename);
}

export function isInCharactersOrFallen(file: NoteRef, campaignFolder: string): boolean {
  if (isInCharacters(file, campaignFolder)) return true;
  return isInFallen(file, campaignFolder);
}
