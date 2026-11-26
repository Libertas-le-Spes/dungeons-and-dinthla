import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { boxTextOf } from "../writing/disk-text";

export type NoteChanged = (path: string, text: string) => void;

export type NoteGone = (path: string) => void;

export interface NoteTexts {
  read(path: string): Promise<string | null>;
  onChanged(changed: NoteChanged): Stop;
  onGone(gone: NoteGone): Stop;
}

export interface NoteTextsNotes {
  readonly store: Pick<NoteStore, "note" | "read">;
  readonly changes: Pick<NoteChanges, "onRead" | "onGone">;
}

class BoxedText {
  constructor(private readonly changed: NoteChanged) {}

  read(note: NoteRef, text: string): void {
    this.changed(note.path, boxTextOf(text));
  }
}

export class HostNoteTexts implements NoteTexts {
  constructor(private readonly notes: NoteTextsNotes) {}

  async read(path: string): Promise<string | null> {
    const note = this.notes.store.note(path);
    if (note === null) return null;
    return boxTextOf(await this.notes.store.read(note));
  }

  onChanged(changed: NoteChanged): Stop {
    const boxed = new BoxedText(changed);
    return this.notes.changes.onRead(boxed.read.bind(boxed));
  }

  onGone(gone: NoteGone): Stop {
    return this.notes.changes.onGone(gone);
  }
}
