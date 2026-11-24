import type { NoteRef } from "../../host/notes/note-ref";
import { importedSessionOf } from "../../characters/imported/reading/imported-session";
import type { PurseCoin } from "../../characters/imported/lists/purse-coin";
import { importedPurseOf } from "../../characters/imported/purse/note-purse";
import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export interface OwnCharacterNotes {
  filesIn(campaignFolder: string): NoteRef[];
  fallenFilesIn(campaignFolder: string): NoteRef[];
  isOwnCharacter(file: NoteRef): boolean;
  textOf(file: NoteRef): Promise<string>;
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
  constructor(private readonly parts: OwnCharactersParts, private readonly syntax: PropertiesSyntax) {}

  names(): string[] {
    return this.files().map((file) => file.basename);
  }

  async sheets(): Promise<OwnSheet[]> {
    const sheets: OwnSheet[] = [];
    for (const file of this.files()) {
      const text = await this.parts.notes.textOf(file);
      sheets.push({ name: file.basename, purse: importedPurseOf(text, this.syntax), importedSession: importedSessionOf(text, this.syntax) });
    }
    return sheets;
  }

  subscribe(changed: () => void): () => void {
    return this.parts.notes.onNoteChanged((path) => {
      const folder = this.parts.store.campaignFolder;
      if (folder === null) return;
      if (path === mainNotePathOf(folder)) changed();
      else if (this.files().some((file) => file.path === path)) changed();
    });
  }

  private files(): NoteRef[] {
    const folder = this.parts.store.campaignFolder;
    if (folder === null) return [];
    const { notes } = this.parts;
    return [...notes.filesIn(folder), ...notes.fallenFilesIn(folder)].filter((file) => notes.isOwnCharacter(file));
  }
}
