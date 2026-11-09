import type { NoteTexts } from "../campaign/note-texts";
import { sessionNoteOf } from "../campaign/session-file";
import type { OpenConfirm } from "../views/confirm-modal";
import { messageOf } from "../views/message-of";
import type { KeptDrafts } from "./kept-drafts";
import { clearTextOf, deleteTextOf } from "./removal-texts";
import type { SessionClearer } from "./session-clearer";
import type { SessionTrash } from "./session-trash";
import { writtenLinesOf } from "./written-lines";

export const NOTE_GONE_NOW = "The session's note is gone, so there is nothing to clear or delete.";
export const SAVE_RUNNING = "A save is running for this session. Try again once it is done.";

export interface RemovalTools {
  clearer: SessionClearer;
  trash: SessionTrash;
  confirm: OpenConfirm;
}

export interface RemovalNeeds extends RemovalTools {
  texts: NoteTexts;
  keptDrafts: KeptDrafts;
}

export interface RemovalMoves {
  heading(): string;
  busy(): boolean;
  say(message: string): void;
  changed(): void;
  deleted(path: string): void;
}

type Work = () => Promise<void>;

function countOf(path: string, text: string): number {
  return writtenLinesOf(sessionNoteOf(path, 0, text)).length;
}

function notReadMessage(error: unknown): string {
  return `Couldn't read the session's note: ${messageOf(error)}`;
}

export class SessionRemoval {
  private running = false;

  constructor(
    private readonly path: string,
    private readonly needs: RemovalNeeds,
    private readonly moves: RemovalMoves,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  async clearNotes(): Promise<void> {
    const text = await this.readNote();
    if (text === null) return;
    const confirmText = clearTextOf(this.moves.heading(), countOf(this.path, text));
    this.needs.confirm(confirmText, () => void this.clear(text));
  }

  async deleteSession(): Promise<void> {
    const text = await this.readNote();
    if (text === null) return;
    const confirmText = deleteTextOf(this.moves.heading(), countOf(this.path, text));
    this.needs.confirm(confirmText, () => void this.remove());
  }

  private async readNote(): Promise<string | null> {
    this.moves.say("");
    let text: string | null;
    try {
      text = await this.needs.texts.read(this.path);
    } catch (error) {
      this.moves.say(notReadMessage(error));
      return null;
    }
    if (text === null) this.moves.say(NOTE_GONE_NOW);
    return text;
  }

  private async clear(asked: string): Promise<void> {
    await this.run(() => this.needs.clearer.clear(this.path, asked), "Couldn't clear the notes");
  }

  private async remove(): Promise<void> {
    const trashed = await this.run(() => this.needs.trash.trash(this.path), "Couldn't delete the session");
    if (!trashed) return;
    this.needs.keptDrafts.noteDeleted(this.path);
    this.moves.deleted(this.path);
  }

  private async run(work: Work, failed: string): Promise<boolean> {
    if (this.running) return false;
    if (this.moves.busy()) {
      this.moves.say(SAVE_RUNNING);
      return false;
    }
    this.running = true;
    this.moves.changed();
    try {
      await work();
      return true;
    } catch (error) {
      this.moves.say(`${failed}: ${messageOf(error)}`);
      return false;
    } finally {
      this.running = false;
      this.moves.changed();
    }
  }
}
