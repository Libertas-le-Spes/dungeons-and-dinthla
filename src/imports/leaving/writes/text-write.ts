import type { TFile } from "obsidian";
import { writeWhenUnchangedSinceRead } from "../../note/writing/checked-note-text";
import type { NoteFiles } from "../../note/writing/note-files";
import type { PlannedWrite } from "./planned-write";

export class TextWrite implements PlannedWrite {
  constructor(
    private readonly files: NoteFiles,
    private readonly file: TFile,
    private readonly before: string,
    private readonly after: string,
    readonly done: string,
    readonly failed: string,
  ) {}

  async apply(): Promise<void> {
    await writeWhenUnchangedSinceRead(this.files, this.file, this.before, this.after);
  }
}
