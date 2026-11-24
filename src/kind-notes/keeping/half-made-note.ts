import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";
import { canMake, type WantedNote } from "../wanting/wanted-note";
import type { NoteAttempts } from "./note-attempts";

export const HALF_MADE_AFTER_MS = 60_000;

export type HalfMade = "no" | "yes" | "too new" | "unreadable";

export interface HalfMadeNeeds {
  store: Pick<NoteStore, "read" | "changedAt">;
  now(): number;
}

export class HalfMadeNote {
  constructor(
    private readonly needs: HalfMadeNeeds,
    private readonly attempts: NoteAttempts,
  ) {}

  async stateOf(file: NoteRef, note: WantedNote): Promise<HalfMade> {
    if (!canMake(note)) return "no";
    try {
      if ((await this.needs.store.read(file)) !== "") return "no";
    } catch (error) {
      this.attempts.fail(note, error);
      return "unreadable";
    }
    if (this.needs.now() - this.needs.store.changedAt(file) < HALF_MADE_AFTER_MS) return "too new";
    return "yes";
  }
}
