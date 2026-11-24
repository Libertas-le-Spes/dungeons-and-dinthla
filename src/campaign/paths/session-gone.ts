import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { sessionLabelOf } from "./session-file";

export function sessionGoneWords(sessionPath: string): string {
  return `${sessionLabelOf(sessionPath)} was moved or deleted, so nothing was written.`;
}

export class OpenedSession {
  private readonly file: NoteRef | null;

  constructor(
    private readonly files: Pick<NoteStore, "note">,
    readonly path: string,
  ) {
    this.file = files.note(path);
  }

  get label(): string {
    return sessionLabelOf(this.path);
  }

  refuseIfMoved(): void {
    const current = this.files.note(this.path);
    if (current === null || current !== this.file) throw new Error(sessionGoneWords(this.path));
  }
}
