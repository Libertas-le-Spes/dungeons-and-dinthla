import type { SaidOnce } from "../../note-keeping/said-once";
import { wantedKeyOf, type WantedNote } from "../wanting/wanted-note";
import { failedMessage } from "./keeper-messages";
import type { NoteMemos } from "./note-memos";

export class NoteAttempts {
  constructor(
    private readonly memos: NoteMemos,
    private readonly said: SaidOnce,
  ) {}

  async attempt(note: WantedNote, act: () => Promise<void>): Promise<boolean> {
    try {
      await act();
      this.memos.settle(note.path, wantedKeyOf(note));
      return true;
    } catch (error) {
      this.fail(note, error);
      return false;
    }
  }

  fail(note: WantedNote, error: unknown): void {
    const key = wantedKeyOf(note);
    this.memos.fail(note.path, key);
    this.said.say(`${note.path}:${key}`, failedMessage(note, error));
  }
}
