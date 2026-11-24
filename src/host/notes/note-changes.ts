import type { NoteRef } from "./note-ref";

export type Stop = () => void;

export interface NoteChanges {
  onMade(heard: (note: NoteRef) => void): Stop;
  onChanged(heard: (note: NoteRef) => void): Stop;
  onGone(heard: (path: string) => void): Stop;
  onMoved(heard: (note: NoteRef, oldPath: string) => void): Stop;
  onRead(heard: (note: NoteRef) => void): Stop;
  onLinksSettled(heard: (note: NoteRef) => void): Stop;
}
