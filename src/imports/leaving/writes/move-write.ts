import type { TFile } from "obsidian";
import type { FencedFileActions } from "../../../fence/gate/fenced-file-actions";
import { parentFolderOf } from "../../../campaign/paths/note-name";
import type { NoteFiles } from "../../note/writing/note-files";
import type { PlannedWrite } from "./planned-write";

export type MoveActions = Pick<FencedFileActions, "renameFile">;

export class MoveWrite implements PlannedWrite {
  constructor(
    private readonly files: NoteFiles,
    private readonly actions: MoveActions,
    private readonly file: TFile,
    private readonly newPath: string,
    readonly done: string,
    readonly failed: string,
  ) {}

  async apply(): Promise<void> {
    const folder = parentFolderOf(this.newPath);
    if (this.files.getFolderByPath(folder) === null) await this.files.createFolder(folder);
    await this.actions.renameFile(this.file, this.newPath);
  }
}
