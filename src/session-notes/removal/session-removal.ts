import type { NoteTexts } from "../../campaign/reading/note-texts";
import { sessionNoteOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import type { ConfirmText, OpenConfirm } from "../../views/dialogs/confirm-dialog";
import { messageOf } from "../../views/dialogs/message-of";
import type { KeptDrafts } from "../kept/kept-drafts";
import type { RenumberingPlan } from "../renumbering/renumbering-plan";
import { latestThatExists } from "../renumbering/latest-that-exists";
import { movesWords, reportWordsOf, type RenumberingReport } from "../renumbering/renumbering-words";
import type { SessionRenumbering } from "../renumbering/session-renumbering";
import { clearTextOf, deleteTextOf } from "./removal-texts";
import type { SessionClearer } from "./session-clearer";
import type { AskedNote, SessionTrash } from "./session-trash";
import { writtenLinesOf } from "../lines/written-lines";
import { PendingWork } from "../../views/pending/pending-work";

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

type Work<T> = () => Promise<T>;

type Read<T> = () => Promise<T | null>;

function countOf(path: string, text: string, syntax: PropertiesSyntax): number {
  return writtenLinesOf(sessionNoteOf(path, 0, text, syntax)).length;
}

function notReadMessage(error: unknown): string {
  return `Couldn't read the session's note: ${messageOf(error)}`;
}

export class SessionRemoval {
  private running = false;
  private asking = false;
  private readonly work = new PendingWork();

  constructor(
    private readonly path: string,
    private readonly needs: RemovalNeeds,
    private readonly moves: RemovalMoves,
    private readonly syntax: PropertiesSyntax,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  clearNotes(): void {
    this.work.add(this.askToClear());
  }

  deleteSession(): void {
    this.work.add(this.askToDelete());
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  private async askToClear(): Promise<void> {
    const text = await this.readToAsk(() => this.needs.texts.read(this.path));
    if (text === null) return;
    const confirmText = clearTextOf(this.moves.heading(), countOf(this.path, text, this.syntax));
    this.ask(confirmText, () => this.work.add(this.clear(text)));
  }

  private async askToDelete(): Promise<void> {
    const asked = await this.readToAsk(() => this.needs.trash.ask(this.path));
    if (asked === null) return;
    const plan = this.needs.renumbering.planFor(this.path);
    if ("error" in plan) {
      this.moves.say(plan.error);
      this.answered();
      return;
    }
    const permanently = this.needs.trash.deletesPermanently();
    const confirmText = deleteTextOf(this.moves.heading(), countOf(this.path, asked.text, this.syntax), movesWords(plan.renames), permanently);
    this.ask(confirmText, () => this.work.add(this.remove(asked, plan)));
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
    const report = await this.run(() => this.trashAndRenumber(asked, askedPlan), "Couldn't delete the session");
    if (report === null) return;
    this.tellAbout(report);
    this.moves.deleted(latestThatExists(askedPlan, report));
  }

  private async trashAndRenumber(asked: AskedNote, askedPlan: RenumberingPlan): Promise<RenumberingReport> {
    const plan = this.needs.renumbering.confirmed(this.path, askedPlan);
    await this.needs.trash.trash(this.path, asked);
    this.needs.keptDrafts.noteDeleted(this.path);
    return this.needs.renumbering.carryOut(plan);
  }

  private tellAbout(report: RenumberingReport): void {
    const words = reportWordsOf(report);
    if (words !== null) this.needs.report(words);
  }

  private async run<T>(work: Work<T>, failed: string): Promise<T | null> {
    if (this.running) return null;
    if (this.moves.busy()) {
      this.moves.say(SAVE_RUNNING);
      return null;
    }
    this.running = true;
    this.moves.changed();
    try {
      return await work();
    } catch (error) {
      this.moves.say(`${failed}: ${messageOf(error)}`);
      return null;
    } finally {
      this.running = false;
      this.moves.changed();
    }
  }
}
