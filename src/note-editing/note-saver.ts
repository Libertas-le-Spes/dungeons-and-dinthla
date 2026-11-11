import { boxTextOf, diskTextFor } from "../campaign/writing/disk-text";
import type { NoteDraft } from "./note-drafts";
import type { FencedFiles } from "../fence/gate/fenced-files";

export type SaverFiles = Pick<FencedFiles, "getFileByPath" | "process">;

export const NOTE_GONE = "The note is gone.";

export const NOTE_CHANGED = "The note was changed somewhere else since it was loaded here, so nothing was saved, and that change is kept.";

export class NoteChangedSince extends Error {}

export class NoteSaver {
  constructor(private readonly files: SaverFiles) {}

  async save(path: string, draft: NoteDraft): Promise<void> {
    const file = this.files.getFileByPath(path);
    if (file === null) throw new Error(NOTE_GONE);
    let changedSince = false;
    await this.files.process(file, (disk) => {
      if (boxTextOf(disk) === draft.base) return diskTextFor(draft.text, disk);
      changedSince = true;
      return disk;
    });
    if (changedSince) throw new NoteChangedSince(NOTE_CHANGED);
  }
}
