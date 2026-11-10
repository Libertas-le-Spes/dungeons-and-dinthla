import type { Removal } from "./note-editor";

export interface Rewrite {
  old: Removal;
  line: string;
}

export interface AddedLines {
  path: string;
  lines: string[];
}

export interface LaterLines extends AddedLines {
  partlyWritten: string;
}

export interface SessionChange {
  removal: Removal | null;
  rewrite: Rewrite | null;
  added: AddedLines | null;
  addedLater: LaterLines | null;
}

export function linesAddedTo(path: string, lines: string[]): SessionChange {
  return { removal: null, rewrite: null, added: { path, lines }, addedLater: null };
}
