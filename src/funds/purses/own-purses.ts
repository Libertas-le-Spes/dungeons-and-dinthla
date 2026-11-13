import type { TFile } from "obsidian";
import { importedPurseOf } from "../../characters/imported/purse/note-purse";
import type { PurseCoin } from "../../characters/imported/lists/purse-coin";

export interface OwnPurseNotes {
  filesIn(campaignFolder: string): TFile[];
  isOwnCharacter(file: TFile): boolean;
  textOf(file: TFile): Promise<string>;
  onNoteChanged(changed: (path: string) => void): () => void;
}

export interface OwnPurse {
  readonly name: string;
  readonly coins: readonly PurseCoin[];
}

async function ownPurseOf(notes: OwnPurseNotes, file: TFile): Promise<OwnPurse | null> {
  const coins = importedPurseOf(await notes.textOf(file));
  if (coins === null) return null;
  return { name: file.basename, coins };
}

export async function ownPursesIn(notes: OwnPurseNotes, campaignFolder: string): Promise<OwnPurse[]> {
  const purses: OwnPurse[] = [];
  for (const file of notes.filesIn(campaignFolder)) {
    if (notes.isOwnCharacter(file) === false) continue;
    const purse = await ownPurseOf(notes, file);
    if (purse !== null) purses.push(purse);
  }
  return purses;
}
