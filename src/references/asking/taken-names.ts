import { campaignFolderOf, isInFallenFolder, isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { aliasesIn } from "../../funds/item-notes/item-note-change";
import { characterReferenceKind } from "../../kinds/character-reference-kind";

export interface TakenNamesNotes {
  readonly store: Pick<NoteStore, "notesUnder" | "notes">;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
}

export interface TakenNamesNeeds {
  notes: TakenNamesNotes;
  campaignFolders(): string[];
}

function isCharacterNote(path: string, campaignFolders: string[]): boolean {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return false;
  return isInReferenceFolder(characterReferenceKind, folder, path) || isInFallenFolder(folder, path);
}

function aliasesOf(facts: TakenNamesNotes["facts"], note: NoteRef): string[] {
  const properties = facts.propertiesOf(note);
  if (properties === null) return [];
  return aliasesIn(properties).filter((alias): alias is string => typeof alias === "string");
}

export function takenNamesOf({ needs, campaignFolder }: { needs: TakenNamesNeeds; campaignFolder: string }): string[] {
  const { store, facts } = needs.notes;
  const characters = store.notes().filter((note) => isCharacterNote(note.path, needs.campaignFolders()));
  const notes = new Set([...store.notesUnder(campaignFolder), ...characters]);
  return [...notes].flatMap((note) => [note.basename, ...aliasesOf(facts, note)]);
}
