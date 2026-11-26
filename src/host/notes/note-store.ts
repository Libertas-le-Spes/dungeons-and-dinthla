import type { NoteRef } from "./note-ref";

export type NoteEdit = (text: string) => string;

export interface NoteStore {
  note(path: string): NoteRef | null;
  notes(): NoteRef[];
  files(): NoteRef[];
  notesUnder(folder: string): NoteRef[];
  hasFolder(path: string): boolean;
  namesIn(folder: string): string[];
  read(note: NoteRef): Promise<string>;
  readKept(note: NoteRef): Promise<string>;
  change(note: NoteRef, edit: NoteEdit): Promise<string>;
  make(path: string, text: string): Promise<NoteRef>;
  makeFolder(path: string): Promise<void>;
  removeEmptyFolder(path: string): Promise<void>;
  move(note: NoteRef, newPath: string): Promise<void>;
  changedAt(note: NoteRef): number;
}
