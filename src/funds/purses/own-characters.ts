import { mainNotePathOf } from "../../campaign/paths/campaign-folders";
import type { PurseStore } from "./own-purse-panel";
import type { OwnPurseNotes } from "./own-purses";

export interface OwnCharactersParts {
  store: Pick<PurseStore, "campaignFolder">;
  notes: OwnPurseNotes;
}

export class OwnCharacters {
  constructor(private readonly parts: OwnCharactersParts) {}

  names(): string[] {
    const folder = this.parts.store.campaignFolder;
    if (folder === null) return [];
    const { notes } = this.parts;
    return notes.filesIn(folder).filter((file) => notes.isOwnCharacter(file)).map((file) => file.basename);
  }

  subscribe(changed: () => void): () => void {
    return this.parts.notes.onNoteChanged((path) => {
      const folder = this.parts.store.campaignFolder;
      if (folder === null) return;
      if (path === mainNotePathOf(folder)) changed();
    });
  }
}
