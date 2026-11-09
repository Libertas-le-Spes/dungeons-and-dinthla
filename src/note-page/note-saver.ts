import type { Vault } from "obsidian";
import type { NoteDraft } from "./note-drafts";

export type SaverVault = Pick<Vault, "getFileByPath" | "process">;

export const NOTE_GONE = "The note is gone.";

export const NOTE_CHANGED = "The note was changed somewhere else since it was loaded here, so nothing was saved, and that change is kept.";

export class NoteChangedSince extends Error {}

export class NoteSaver {
  constructor(private readonly vault: SaverVault) {}

  async save(path: string, draft: NoteDraft): Promise<void> {
    const file = this.vault.getFileByPath(path);
    if (file === null) throw new Error(NOTE_GONE);
    let changedSince = false;
    await this.vault.process(file, (now) => {
      if (now === draft.base) return draft.text;
      changedSince = true;
      return now;
    });
    if (changedSince) throw new NoteChangedSince(NOTE_CHANGED);
  }
}
