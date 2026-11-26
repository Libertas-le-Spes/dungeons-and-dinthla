import type { NoteRef } from "../../../host/notes/note-ref";

export type SettledStatus = "held" | "sold" | "used" | "lost";

export interface HeldItem {
  readonly name: string;
  readonly shown: string;
}

export interface SheetItem {
  readonly written: string;
  readonly count: string | null;
}

export interface FundsLook {
  standingOf(written: string): string | null;
  canTrack(written: string): boolean;
  heldButNotImported(): readonly HeldItem[];
}

export interface ItemTracking {
  lookAt(file: NoteRef, written: readonly string[]): FundsLook | null;
  whyNotTracked(file: NoteRef): string;
  track(file: NoteRef, item: SheetItem, returnFocus: () => void): void;
  settle(file: NoteRef, name: string, status: SettledStatus, returnFocus: () => void): void;
}
