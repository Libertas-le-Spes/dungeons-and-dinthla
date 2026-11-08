import { Notice, type App, type TFile } from "obsidian";
import { campaignFolderOf, charactersFolderOf, findCampaignFolders, NO_CAMPAIGN } from "../campaign/campaign-folders";
import { messageOf } from "../views/message-of";
import { blankEntry, entryOf, type CharacterEntry } from "./character-entry";
import { createCharacter, deleteCharacter, saveCharacter } from "./character-files";
import { CharacterModal } from "./character-modal";

const NEW_WHERE = "Every other sheet value starts as not known.";
const EDIT_WHERE = "Renaming updates every [[link]] to this character in your notes.";

export function isCharacterNote(path: string, campaignFolders: string[]): boolean {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return false;
  return path.startsWith(`${charactersFolderOf(folder)}/`) && path.endsWith(".md");
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
  new CharacterModal(app, { title: "New character", entry: blankEntry(), where, save, delete: null }, onClosed).open();
}

export async function openEditCharacter(app: App, file: TFile): Promise<void> {
  let before: CharacterEntry;
  try {
    before = entryOf(file.basename, file.path, await app.vault.read(file));
  } catch (error) {
    new Notice(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    title: "Edit character",
    entry: before,
    where: EDIT_WHERE,
    save: (entry: CharacterEntry) => saveCharacter(app.vault, app.fileManager, file, before, entry),
    delete: () => deleteCharacter(app.fileManager, file),
  };
  new CharacterModal(app, dialog, () => {}).open();
}

export function editActiveCharacter(app: App, checking: boolean): boolean {
  const file = app.workspace.getActiveFile();
  if (file === null) return false;
  const campaignFolders = findCampaignFolders(app.vault.getFiles().map((note) => note.path));
  if (!isCharacterNote(file.path, campaignFolders)) return false;
  if (!checking) void openEditCharacter(app, file);
  return true;
}
