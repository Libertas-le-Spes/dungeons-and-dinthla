import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import type { LinkLookup } from "../../host/notes/link-lookup";
import type { NoteStore } from "../../host/notes/note-store";

export interface Character {
  name: string;
  linktext: string;
}

export interface CharacterLinks {
  readonly store: Pick<NoteStore, "notes">;
  readonly links: Pick<LinkLookup, "linkTextTo">;
}

function isListed(characters: readonly Character[], name: string): boolean {
  for (const character of characters) {
    if (character.name === name) return true;
  }
  return false;
}

function byName(first: Character, second: Character): number {
  return first.name.localeCompare(second.name);
}

export function charactersIn(notes: CharacterLinks, campaignFolder: string, sessionPath: string): Character[] {
  const characters: Character[] = [];
  for (const note of notes.store.notes()) {
    if (!isInReferenceFolder(characterReferenceKind, campaignFolder, note.path)) continue;
    if (isListed(characters, note.basename)) continue;
    characters.push({ name: note.basename, linktext: notes.links.linkTextTo(note, sessionPath, true) });
  }
  return characters.sort(byName);
}
