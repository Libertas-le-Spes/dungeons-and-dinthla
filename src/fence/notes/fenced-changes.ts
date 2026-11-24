import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteRef } from "../../host/notes/note-ref";
import type { HandedNotes } from "./handed-notes";

type HeardNote = (note: NoteRef) => void;
type HeardPath = (path: string) => void;
type HeardMove = (note: NoteRef, oldPath: string) => void;

class PassInside {
  constructor(
    private readonly handed: HandedNotes,
    private readonly heard: HeardNote,
  ) {}

  note(note: NoteRef): void {
    const inside = this.handed.hand(note);
    if (inside !== null) this.heard(inside);
  }
}

class PassGone {
  constructor(
    private readonly handed: HandedNotes,
    private readonly heard: HeardPath,
  ) {}

  path(path: string): void {
    if (this.handed.holds(path)) this.heard(path);
  }
}

class PassMove {
  constructor(
    private readonly handed: HandedNotes,
    private readonly moved: HeardMove,
  ) {}

  note(note: NoteRef, oldPath: string): void {
    const inside = this.handed.hand(note);
    if (inside !== null && this.handed.holds(oldPath)) this.moved(inside, oldPath);
  }
}

export class FencedChanges implements NoteChanges {
  constructor(
    private readonly raw: NoteChanges,
    private readonly handed: HandedNotes,
  ) {}

  onMade(heard: HeardNote): Stop {
    const pass = new PassInside(this.handed, heard);
    return this.raw.onMade(pass.note.bind(pass));
  }

  onChanged(heard: HeardNote): Stop {
    const pass = new PassInside(this.handed, heard);
    return this.raw.onChanged(pass.note.bind(pass));
  }

  onGone(heard: HeardPath): Stop {
    const pass = new PassGone(this.handed, heard);
    return this.raw.onGone(pass.path.bind(pass));
  }

  onMoved(heard: HeardMove): Stop {
    const pass = new PassMove(this.handed, heard);
    return this.raw.onMoved(pass.note.bind(pass));
  }

  onRead(heard: HeardNote): Stop {
    const pass = new PassInside(this.handed, heard);
    return this.raw.onRead(pass.note.bind(pass));
  }

  onLinksSettled(heard: () => void): Stop {
    return this.raw.onLinksSettled(heard);
  }
}
