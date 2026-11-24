import type { NoteRef } from "../../host/notes/note-ref";

export class HeardPath {
  constructor(private readonly heard: (path: string) => void) {}

  note(note: NoteRef): void {
    this.heard(note.path);
  }

  moved(note: NoteRef, oldPath: string): void {
    this.heard(oldPath);
    this.heard(note.path);
  }
}
