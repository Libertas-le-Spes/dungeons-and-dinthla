import type { NoteRef } from "./note-ref";

export type LinkCounts = Readonly<Record<string, Readonly<Record<string, number>>>>;

export interface LinkLookup {
  target(linkText: string, fromPath: string): NoteRef | null;
  linkTextTo(note: NoteRef, fromPath: string, withoutEnding: boolean): string;
  unresolvedIn(path: string): string[];
  linkCounts(): LinkCounts;
}
