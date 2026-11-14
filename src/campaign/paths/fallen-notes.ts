import { fallenNotePathOf } from "./campaign-folders";
import { noteAtPathOf, type NamedNote } from "./note-at-path";

export function fallenNoteOf<T extends NamedNote>(notes: readonly T[], campaignFolder: string, name: string): T | null {
  return noteAtPathOf(notes, fallenNotePathOf(campaignFolder, name));
}

export function leftPlayWords(name: string): string {
  return `${name} is in this campaign's Fallen folder, so no second note was made for them. Make them main from the Fallen list to bring them back.`;
}
