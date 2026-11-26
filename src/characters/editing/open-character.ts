import { campaignOfReference, NO_CAMPAIGN, referenceFolderOf } from "../../campaign/paths/campaign-folders";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { messageOf } from "../../views/dialogs/message-of";
import type { DialogShowing } from "../../views/dialogs/dialog-view";
import { blankEntry, entryOf, learnedOf, type CharacterEntry, type Learned } from "./character-entry";
import { createCharacter, deleteCharacter, saveCharacter, type CharacterFileActions, type CharacterFiles } from "./character-files";
import { CharacterEditDialog } from "./character-dialog";
import type { CharacterNotes } from "../reading/character-notes";
import { factsByCharacter } from "../reading/sheet-values";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import type { PathSpelling } from "../../host/rules/path-spelling";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export const EDIT_WHERE = "Renaming updates links if Obsidian's link updating is on.";

export const NOT_A_CHARACTER = "Only a note in a campaign's Characters folder can be edited as a character.";

export interface CharacterEditingNotes {
  readonly store: CharacterFiles["store"] & Pick<NoteStore, "note" | "read">;
  readonly keeping: CharacterFileActions;
}

export interface CharacterEditing {
  readonly showing: DialogShowing;
  readonly notes: CharacterEditingNotes;
  readonly characters: CharacterNotes;
  readonly spelling: PathSpelling;
  readonly syntax: PropertiesSyntax;
}

export interface Character {
  file: NoteRef;
  campaignFolder: string;
}

export type OpenMadeNote = (note: NoteRef) => Promise<void>;

function characterFilesOf(editing: CharacterEditing): CharacterFiles {
  return { store: editing.notes.store, spelling: editing.spelling };
}

export function characterAt(editing: CharacterEditing, path: string): Character | null {
  const campaignFolder = campaignOfReference(characterReferenceKind, path, editing.characters.campaignFolders());
  if (campaignFolder === null) return null;
  const file = editing.notes.store.note(path);
  if (file === null) return null;
  return { file, campaignFolder };
}

class NewCharacter {
  constructor(
    private readonly editing: CharacterEditing,
    private readonly campaignFolder: string,
    private readonly openMade: OpenMadeNote,
  ) {}

  async save(entry: CharacterEntry): Promise<boolean> {
    const note = await createCharacter(characterFilesOf(this.editing), this.campaignFolder, entry);
    if (note === null) return false;
    void this.opened(note);
    return true;
  }

  private async opened(note: NoteRef): Promise<void> {
    try {
      await this.openMade(note);
    } catch (error) {
      this.editing.showing.telling.say(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
    }
  }
}

export function openNewCharacter(editing: CharacterEditing, campaignFolder: string | null, openMade: OpenMadeNote, onClosed: () => void): void {
  if (campaignFolder === null) {
    editing.showing.telling.say(NO_CAMPAIGN);
    return;
  }
  const making = new NewCharacter(editing, campaignFolder, openMade);
  const where = `Adds a note to ${referenceFolderOf(characterReferenceKind, campaignFolder)}.`;
  const dialog = { title: "New character", entry: blankEntry(), learned: new Map(), where, save: making.save.bind(making), delete: null };
  editing.showing.dialogs.open(new CharacterEditDialog(editing.showing.telling, dialog, onClosed));
}

async function learnedAbout(notes: CharacterNotes, character: Character): Promise<Learned> {
  const sessions = await notes.sessionsOf(character.campaignFolder);
  const facts = factsByCharacter(sessions, (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath)).get(character.file.path);
  if (facts === undefined) return new Map();
  return learnedOf(facts);
}

function stayPut(): void {}

export async function openEditCharacter(editing: CharacterEditing, character: Character): Promise<void> {
  const { file } = character;
  const openedPath = file.path;
  let before: CharacterEntry;
  let learned: Learned;
  try {
    before = entryOf(file.basename, file.path, await editing.notes.store.read(file), editing.syntax);
    learned = await learnedAbout(editing.characters, character);
  } catch (error) {
    editing.showing.telling.say(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    title: "Edit character",
    entry: before,
    learned,
    where: EDIT_WHERE,
    save: (after: CharacterEntry) => saveCharacter(characterFilesOf(editing), editing.notes.keeping, character.campaignFolder, file, openedPath, before, after, editing.syntax),
    delete: () => deleteCharacter(editing.notes.keeping, file),
  };
  editing.showing.dialogs.open(new CharacterEditDialog(editing.showing.telling, dialog, stayPut));
}

export function editCharacterAt(editing: CharacterEditing, path: string | null, checking: boolean): boolean {
  if (path === null) return false;
  const character = characterAt(editing, path);
  if (character === null) return false;
  if (!checking) void openEditCharacter(editing, character);
  return true;
}

export function editCharacter(editing: CharacterEditing, file: NoteRef): void {
  const character = characterAt(editing, file.path);
  if (character === null) {
    editing.showing.telling.say(NOT_A_CHARACTER);
    return;
  }
  void openEditCharacter(editing, character);
}
