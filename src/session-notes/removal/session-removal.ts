import type { NoteTexts } from "../../campaign/reading/note-texts";
import { sessionNoteOf } from "../../campaign/paths/session-file";
import type { ConfirmText, OpenConfirm } from "../../views/dialogs/confirm-modal";
import { messageOf } from "../../views/dialogs/message-of";
import type { KeptDrafts } from "../kept/kept-drafts";
import type { RenumberingPlan } from "../renumbering/renumbering-plan";
import { movesWords, reportWordsOf, type RenumberingReport } from "../renumbering/renumbering-words";
import type { SessionRenumbering } from "../renumbering/session-renumbering";
import { clearTextOf, deleteTextOf } from "./removal-texts";
import type { SessionClearer } from "./session-clearer";
import type { AskedNote, SessionTrash } from "./session-trash";
import { writtenLinesOf } from "../lines/written-lines";

export const NOTE_GONE_NOW = "The session's note is gone, so there is nothing to clear or delete.";
export const SAVE_RUNNING = "A save is running for this session. Try again once it is done.";

export interface RemovalTools {
  clearer: SessionClearer;
  trash: SessionTrash;
  renumbering: Pick<SessionRenumbering, "planFor" | "confirmed" | "carryOut">;
  confirm: OpenConfirm;
  report(message: string): void;
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
  deleted(latest: string | null): void;
}

type Work = () => Promise<void>;

type Read<T> = () => Promise<T | null>;

function countOf(path: string, text: string): number {
  return writtenLinesOf(sessionNoteOf(path, 0, text)).length;
}

function notReadMessage(error: unknown): string {
  return `Couldn't read the session's note: ${messageOf(error)}`;
}

export class SessionRemoval {
  private running = false;
  private asking = false;

  constructor(
    private readonly path: string,
    private readonly needs: RemovalNeeds,
    private readonly moves: RemovalMoves,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  async clearNotes(): Promise<void> {
    const text = await this.readToAsk(() => this.needs.texts.read(this.path));
    if (text === null) return;
    const confirmText = clearTextOf(this.moves.heading(), countOf(this.path, text));
    this.ask(confirmText, () => void this.clear(text));
  }

  async deleteSession(): Promise<void> {
    const asked = await this.readToAsk(() => this.needs.trash.ask(this.path));
    if (asked === null) return;
    const plan = this.needs.renumbering.planFor(this.path);
    if ("error" in plan) {
      this.moves.say(plan.error);
      this.answered();
      return;
    }
    const permanently = this.needs.trash.deletesPermanently();
    const confirmText = deleteTextOf(this.moves.heading(), countOf(this.path, asked.text), movesWords(plan.renames), permanently);
    this.ask(confirmText, () => void this.remove(asked, plan));
  }

  private async readToAsk<T>(read: Read<T>): Promise<T | null> {
    if (this.asking || this.running) return null;
    this.asking = true;
    const found = await this.readNote(read);
    if (found === null) this.answered();
    return found;
  }

  private async readNote<T>(read: Read<T>): Promise<T | null> {
    this.moves.say("");
    let found: T | null;
    try {
      found = await read();
    } catch (error) {
      this.moves.say(notReadMessage(error));
      return null;
    }
    if (found === null) this.moves.say(NOTE_GONE_NOW);
    return found;
  }

  private ask(text: ConfirmText, confirmed: () => void): void {
    this.needs.confirm(text, confirmed, () => this.answered());
  }

  private answered(): void {
    this.asking = false;
  }

  private async clear(asked: string): Promise<void> {
    await this.run(() => this.needs.clearer.clear(this.path, asked), "Couldn't clear the notes");
  }

  private async remove(asked: AskedNote, askedPlan: RenumberingPlan): Promise<void> {
    let report: RenumberingReport | null = null;
    const trashed = await this.run(async () => {
      const plan = this.needs.renumbering.confirmed(this.path, askedPlan);
      await this.needs.trash.trash(this.path, asked);
      this.needs.keptDrafts.noteDeleted(this.path);
      report = await this.needs.renumbering.carryOut(plan);
    }, "Couldn't delete the session");
    if (!trashed) return;
    this.tellAbout(report);
    this.moves.deleted(askedPlan.latest);
  }

  private tellAbout(report: RenumberingReport | null): void {
    if (report === null) return;
    const words = reportWordsOf(report);
    if (words !== null) this.needs.report(words);
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
