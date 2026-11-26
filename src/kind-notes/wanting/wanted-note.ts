import type { NoteRef } from "../../host/notes/note-ref";

export interface WantedNote {
  path: string;
  folder: string;
  sessionPath: string;
  sessionFile: NoteRef | null;
  lines: string[];
}

export interface MakeableNote extends WantedNote {
  sessionFile: NoteRef;
}

export function wantedKeyOf(wanted: WantedNote): string {
  return JSON.stringify(wanted.lines);
}

export function canMake(note: WantedNote): note is MakeableNote {
  return note.sessionFile !== null && note.lines.length > 0;
}
