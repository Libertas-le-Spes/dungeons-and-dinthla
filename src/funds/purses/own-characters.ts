import type { TFile } from "obsidian";
import { importedSessionOf } from "../../characters/imported/reading/imported-session";
import type { PurseCoin } from "../../characters/imported/lists/purse-coin";
import { importedPurseOf } from "../../characters/imported/purse/note-purse";
import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";

export interface OwnCharacterNotes {
  filesIn(campaignFolder: string): TFile[];
  isOwnCharacter(file: TFile): boolean;
  textOf(file: TFile): Promise<string>;
  onNoteChanged(changed: (path: string) => void): () => void;
}

export interface OwnSheet {
  readonly name: string;
  readonly purse: readonly PurseCoin[] | null;
  readonly importedSession: number | null;
}

export interface OwnCharactersParts {
  store: Pick<CampaignStore, "campaignFolder">;
  notes: OwnCharacterNotes;
}

export class OwnCharacters {
  constructor(private readonly parts: OwnCharactersParts) {}

  names(): string[] {
    return this.files().map((file) => file.basename);
  }

  async sheets(): Promise<OwnSheet[]> {
    const sheets: OwnSheet[] = [];
    for (const file of this.files()) {
      const text = await this.parts.notes.textOf(file);
      sheets.push({ name: file.basename, purse: importedPurseOf(text), importedSession: importedSessionOf(text) });
    }
    return sheets;
  }

  subscribe(changed: () => void): () => void {
    return this.parts.notes.onNoteChanged((path) => {
      const folder = this.parts.store.campaignFolder;
      if (folder === null) return;
      if (path === mainNotePathOf(folder) || this.files().some((file) => file.path === path)) changed();
    });
  }

  private files(): TFile[] {
    const folder = this.parts.store.campaignFolder;
    if (folder === null) return [];
    const { notes } = this.parts;
    return notes.filesIn(folder).filter((file) => notes.isOwnCharacter(file));
  }
}
