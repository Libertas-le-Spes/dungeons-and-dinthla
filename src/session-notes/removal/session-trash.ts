import { boxTextOf } from "../../campaign/writing/disk-text";
import { SESSION_GONE } from "./session-clearer";
import type { NoteKeeping } from "../../host/notes/note-keeping";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";

export type TrashFiles = Pick<NoteStore, "note" | "read">;

export type TrashFileActions = Pick<NoteKeeping, "throwAway">;

export type DeletesPermanently = () => boolean;

export interface AskedNote {
  file: NoteRef;
  text: string;
}

export const CHANGED_SINCE_ASKED_TO_DELETE =
  "the session's note changed since you were asked, so it wasn't deleted. Look at its notes again first.";

export class SessionTrash {
  constructor(
    private readonly files: TrashFiles,
    private readonly actions: TrashFileActions,
    readonly deletesPermanently: DeletesPermanently,
  ) {}

  async ask(path: string): Promise<AskedNote | null> {
    const file = this.files.note(path);
    if (file === null) return null;
    const text = await this.textOf(file);
    return { file, text };
  }

  async trash(path: string, asked: AskedNote): Promise<void> {
    const file = this.files.note(path);
    if (file === null) throw new Error(SESSION_GONE);
    if (file !== asked.file) throw new Error(CHANGED_SINCE_ASKED_TO_DELETE);
    const text = await this.textOf(file);
    if (text !== asked.text) throw new Error(CHANGED_SINCE_ASKED_TO_DELETE);
    await this.actions.throwAway(file);
  }

  private async textOf(file: NoteRef): Promise<string> {
    const disk = await this.files.read(file);
    return boxTextOf(disk);
  }
}
