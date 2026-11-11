import type { Removal } from "../writing/note-editor";

export interface Rewrite {
  old: Removal;
  line: string;
}

export interface LaterLines {
  path: string;
  lines: string[];
  partlyWritten: string;
}

export interface AddedLines {
  path: string;
  lines: string[];
  later: LaterLines | null;
}

export interface RewriteChange {
  rewrite: Rewrite;
}

export interface LinesChange {
  removal: Removal | null;
  added: AddedLines | null;
}

export type SessionChange = RewriteChange | LinesChange;

export function linesAddedTo(path: string, lines: string[]): SessionChange {
  return { removal: null, added: { path, lines, later: null } };
}

export function lineTakenOut(removal: Removal): SessionChange {
  return { removal, added: null };
}
