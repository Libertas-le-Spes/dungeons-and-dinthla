import { parentFolderOf } from "../../../campaign/paths/note-name";
import type { NoteFiles } from "../../note/writing/note-files";
import type { PlannedWrite } from "./planned-write";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { NoteKeeping } from "../../../host/notes/note-keeping";

export type MoveActions = Pick<NoteKeeping, "moveWithLinks">;

export class MoveWrite implements PlannedWrite {
  constructor(
    private readonly files: NoteFiles,
    private readonly actions: MoveActions,
    private readonly file: NoteRef,
    private readonly newPath: string,
    readonly done: string,
    readonly failed: string,
  ) {}

  async apply(): Promise<void> {
    const folder = parentFolderOf(this.newPath);
    if (!this.files.hasFolder(folder)) await this.files.makeFolder(folder);
    await this.actions.moveWithLinks(this.file, this.newPath);
  }
}
