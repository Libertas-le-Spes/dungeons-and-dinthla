import { Notice, type App, type Menu, type TAbstractFile, type TFile } from "obsidian";
import { campaignFolderOf, charactersFolderOf, NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { blankEntry, entryOf, learnedOf, type CharacterEntry, type Learned } from "./character-entry";
import { createCharacter, deleteCharacter, saveCharacter } from "./character-files";
import { CharacterModal } from "./character-modal";
import type { CharacterNotes } from "./character-notes";
import { factsByCharacter } from "./sheet-values";

const NEW_WHERE = "Every other sheet value starts as not known.";
export const EDIT_WHERE =
  "Renaming updates every [[link]] to this character while Obsidian's Automatically update internal links setting is on.";

interface Character {
  file: TFile;
  campaignFolder: string;
}

export function campaignOfCharacter(path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null || !path.startsWith(`${charactersFolderOf(folder)}/`) || !path.endsWith(".md")) return null;
  return folder;
}

function characterAt(app: App, notes: CharacterNotes, path: string): Character | null {
  const campaignFolder = campaignOfCharacter(path, notes.campaignFolders());
  if (campaignFolder === null) return null;
  const file = app.vault.getFileByPath(path);
  if (file === null) return null;
  return { file, campaignFolder };
}

async function openMade(app: App, note: TFile): Promise<void> {
  try {
    await app.workspace.getLeaf(false).openFile(note);
  } catch (error) {
    new Notice(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
  }
}

export function openNewCharacter(app: App, campaignFolder: string | null, onClosed: () => void): void {
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const save = async (entry: CharacterEntry) => {
    const note = await createCharacter(app.vault, campaignFolder, entry);
    if (note === null) return false;
    void openMade(app, note);
    return true;
  };
  const where = `Adds a note to ${charactersFolderOf(campaignFolder)}. ${NEW_WHERE}`;
  const dialog = { title: "New character", entry: blankEntry(), learned: new Map(), where, save, delete: null };
  new CharacterModal(app, dialog, onClosed).open();
}

async function learnedAbout(notes: CharacterNotes, character: Character): Promise<Learned> {
  const sessions = await notes.sessionsOf(character.campaignFolder);
  const facts = factsByCharacter(sessions, (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath)).get(character.file.path);
  if (facts === undefined) return new Map();
  return learnedOf(facts);
}

export async function openEditCharacter(app: App, notes: CharacterNotes, character: Character): Promise<void> {
  const { file } = character;
  const openedPath = file.path;
  let before: CharacterEntry;
  let learned: Learned;
  try {
    before = entryOf(file.basename, file.path, await app.vault.read(file));
    learned = await learnedAbout(notes, character);
  } catch (error) {
    new Notice(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    title: "Edit character",
    entry: before,
    learned,
    where: EDIT_WHERE,
    save: (after: CharacterEntry) => saveCharacter(app.vault, app.fileManager, file, openedPath, before, after),
    delete: () => deleteCharacter(app.fileManager, file),
  };
  new CharacterModal(app, dialog, () => {}).open();
}

export function editActiveCharacter(app: App, notes: CharacterNotes, checking: boolean): boolean {
  const active = app.workspace.getActiveFile();
  if (active === null) return false;
  const character = characterAt(app, notes, active.path);
  if (character === null) return false;
  if (!checking) void openEditCharacter(app, notes, character);
  return true;
}

export const NOT_A_CHARACTER = "Only a note in a campaign's Characters folder can be edited as a character.";

export function editCharacter(app: App, notes: CharacterNotes, file: TFile): void {
  const character = characterAt(app, notes, file.path);
  if (character === null) {
    new Notice(NOT_A_CHARACTER);
    return;
  }
  void openEditCharacter(app, notes, character);
}

export function addEditCharacterItem(app: App, notes: CharacterNotes, menu: Menu, file: TAbstractFile): void {
  const character = characterAt(app, notes, file.path);
  if (character === null) return;
  menu.addItem((item) => item.setTitle("Edit character").setIcon("pencil").onClick(() => void openEditCharacter(app, notes, character)));
}
