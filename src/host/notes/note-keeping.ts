import type { NoteRef } from "./note-ref";

export type ChangeProperties = (properties: Record<string, unknown>) => void;

export interface NoteKeeping {
  moveWithLinks(note: NoteRef, newPath: string): Promise<void>;
  throwAway(note: NoteRef): Promise<void>;
  throwsAwayForGood(): boolean;
  changeProperties(note: NoteRef, change: ChangeProperties): Promise<void>;
}
