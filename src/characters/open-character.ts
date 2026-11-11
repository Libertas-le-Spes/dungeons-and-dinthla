import { Notice, type App, type Menu, type TAbstractFile, type TFile } from "obsidian";
import { campaignOfReference, NO_CAMPAIGN, referenceFolderOf } from "../campaign/campaign-folders";
import { characterReferenceKind } from "../kinds/character-reference-kind";
import { messageOf } from "../views/dialogs/message-of";
import { blankEntry, entryOf, learnedOf, type CharacterEntry, type Learned } from "./character-entry";
import { createCharacter, deleteCharacter, saveCharacter } from "./character-files";
import { CharacterModal } from "./character-modal";
import type { CharacterNotes } from "./character-notes";
import { factsByCharacter } from "./sheet-values";
import type { Gate } from "../fence/gatekeeper";

const NEW_WHERE = "Every other sheet value starts as not known.";
export const EDIT_WHERE =
  "Renaming updates every [[link]] to this character while Obsidian's Automatically update internal links setting is on.";

interface Character {
  file: TFile;
  campaignFolder: string;
}

function characterAt(gate: Gate, notes: CharacterNotes, path: string): Character | null {
  const campaignFolder = campaignOfReference(characterReferenceKind, path, notes.campaignFolders());
  if (campaignFolder === null) return null;
  const file = gate.files.getFileByPath(path);
  if (file === null) return null;
  return { file, campaignFolder };
}

async function openMade(app: App, gate: Gate, note: TFile): Promise<void> {
  const file = gate.files.getFileByPath(note.path);
  if (file === null) return;
  try {
    await app.workspace.getLeaf(false).openFile(file);
  } catch (error) {
    new Notice(`${note.basename} was made but couldn't be opened: ${messageOf(error)}`);
  }
}

export function openNewCharacter(app: App, gate: Gate, campaignFolder: string | null, onClosed: () => void): void {
  if (campaignFolder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const save = async (entry: CharacterEntry) => {
    const note = await createCharacter(gate.files, campaignFolder, entry);
    if (note === null) return false;
    void openMade(app, gate, note);
    return true;
  };
  const where = `Adds a note to ${referenceFolderOf(characterReferenceKind, campaignFolder)}. ${NEW_WHERE}`;
  const dialog = { title: "New character", entry: blankEntry(), learned: new Map(), where, save, delete: null };
  new CharacterModal(app, dialog, onClosed).open();
}

async function learnedAbout(notes: CharacterNotes, character: Character): Promise<Learned> {
  const sessions = await notes.sessionsOf(character.campaignFolder);
  const facts = factsByCharacter(sessions, (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath)).get(character.file.path);
  if (facts === undefined) return new Map();
  return learnedOf(facts);
}

export async function openEditCharacter(app: App, gate: Gate, notes: CharacterNotes, character: Character): Promise<void> {
  const { file } = character;
  const openedPath = file.path;
  let before: CharacterEntry;
  let learned: Learned;
  try {
    before = entryOf(file.basename, file.path, await gate.files.read(file));
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
    save: (after: CharacterEntry) => saveCharacter(gate.files, gate.fileActions, file, openedPath, before, after),
    delete: () => deleteCharacter(gate.fileActions, file),
  };
  new CharacterModal(app, dialog, () => {}).open();
}

export type ShownPath = () => string | null;

function activePathOf(app: App, shownPath: ShownPath): string | null {
  const active = app.workspace.getActiveFile();
  if (active !== null) return active.path;
  return shownPath();
}

export function editActiveCharacter(app: App, gate: Gate, notes: CharacterNotes, shownPath: ShownPath, checking: boolean): boolean {
  const path = activePathOf(app, shownPath);
  if (path === null) return false;
  const character = characterAt(gate, notes, path);
  if (character === null) return false;
  if (!checking) void openEditCharacter(app, gate, notes, character);
  return true;
}

export const NOT_A_CHARACTER = "Only a note in a campaign's Characters folder can be edited as a character.";

export function editCharacter(app: App, gate: Gate, notes: CharacterNotes, file: TFile): void {
  const character = characterAt(gate, notes, file.path);
  if (character === null) {
    new Notice(NOT_A_CHARACTER);
    return;
  }
  void openEditCharacter(app, gate, notes, character);
}

export function addEditCharacterItem(app: App, gate: Gate, notes: CharacterNotes, menu: Menu, file: TAbstractFile): void {
  const character = characterAt(gate, notes, file.path);
  if (character === null) return;
  menu.addItem((item) => item.setTitle("Edit character").setIcon("pencil").onClick(() => void openEditCharacter(app, gate, notes, character)));
}
