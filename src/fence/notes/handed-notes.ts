import type { NoteRef } from "../../host/notes/note-ref";
import { Fence, OUTSIDE_FENCE } from "../paths/fence";

export class HandedNotes {
  private readonly handed = new WeakSet<NoteRef>();

  constructor(private readonly fence: Fence) {}

  hand(note: NoteRef | null): NoteRef | null {
    if (note === null || !this.fence.holds(note.path)) return null;
    this.handed.add(note);
    return note;
  }

  handAll(notes: readonly NoteRef[]): NoteRef[] {
    const inside: NoteRef[] = [];
    for (const note of notes) {
      const handed = this.hand(note);
      if (handed !== null) inside.push(handed);
    }
    return inside;
  }

  held(note: NoteRef): NoteRef {
    if (!this.handed.has(note) || !this.fence.holds(note.path)) throw new Error(`Couldn't use ${note.path}: ${OUTSIDE_FENCE}`);
    return note;
  }

  insidePath(path: string): string {
    if (!this.fence.holds(path)) throw new Error(`Couldn't use ${path}: ${OUTSIDE_FENCE}`);
    return path;
  }

  insideNewPath(path: string): string {
    if (!this.fence.holdsNew(path)) throw new Error(`Couldn't use ${path}: ${OUTSIDE_FENCE}`);
    return path;
  }

  holds(path: string): boolean {
    return this.fence.holds(path);
  }

  holdsFolder(path: string): boolean {
    return this.fence.holds(path) || this.fence.isTheFolder(path);
  }
}
