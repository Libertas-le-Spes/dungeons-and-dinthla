import type { Campaign } from "../../campaign/record/campaign";
import type { NoteEditingNeeds } from "../../note-editing/note-editing";
import type { LinkActions } from "../../views/lists/linked-text";
import { EditAllPanel } from "./edit-all-panel";
import type { KeptDrafts } from "../kept/kept-drafts";
import { LinesList } from "../lines/lines-list";
import { NotesButtons } from "./notes-buttons";
import { SessionRemoval, type RemovalTools } from "../removal/session-removal";
import { WritingPanel, type WritingNeeds } from "../writing/writing-panel";
import type { LineOpeners } from "../lines/line-opener-of";
import type { WrittenLine } from "../lines/written-lines";

export interface SessionWritingNeeds extends WritingNeeds {
  actions: LinkActions;
  lineOpeners: LineOpeners;
  wholeText: NoteEditingNeeds;
  keptDrafts: KeptDrafts;
  removal: RemovalTools;
}

export interface SessionMoves {
  heading(): string;
  deleted(latest: string | null): void;
}

export class SessionWriting {
  private readonly writing: WritingPanel;
  private readonly lines: LinesList;
  private readonly buttons: NotesButtons;
  private readonly editAll: EditAllPanel;
  private readonly removal: SessionRemoval;
  private readonly stops: (() => void)[];
  private lineCount = 0;

  constructor(
    root: HTMLElement,
    private readonly path: string,
    private readonly needs: SessionWritingNeeds,
    moves: SessionMoves,
  ) {
    this.writing = new WritingPanel(root, path, needs);
    this.lines = new LinesList(root, { actions: needs.actions, openers: needs.lineOpeners });
    this.buttons = new NotesButtons(this.lines.head, {
      editAll: () => this.openEditAll(),
      clearNotes: () => this.removal.clearNotes(),
      deleteSession: () => this.removal.deleteSession(),
    });
    this.editAll = new EditAllPanel(root, path, needs.wholeText, () => this.editAllLeft());
    this.removal = new SessionRemoval(path, { ...needs.removal, texts: needs.wholeText.texts, keptDrafts: needs.keptDrafts }, {
      heading: () => moves.heading(),
      busy: () => this.isSaving(),
      say: (message) => this.buttons.say(message),
      changed: () => this.removalChanged(),
      deleted: (latest) => moves.deleted(latest),
    });
    this.stops = [
      needs.wholeText.drafts.subscribe((changed) => this.wholeTextKept(changed)),
      needs.drafts.subscribe((changed) => this.linesKept(changed)),
    ];
    this.wholeTextKept(path);
    this.refreshButtons();
  }

  focus(): void {
    this.writing.focus();
  }

  async settled(): Promise<void> {
    await this.linesSaveSettled();
    await this.editAllSettled();
    await this.removalSettled();
  }

  linesSaveSettled(): Promise<void> {
    return this.writing.saveSettled();
  }

  removalSettled(): Promise<void> {
    return this.removal.settled();
  }

  editAllSettled(): Promise<void> {
    return this.editAll.settled();
  }

  close(): void {
    for (const stop of this.stops) stop();
    this.editAll.close();
    this.writing.close();
  }

  show(lines: WrittenLine[], campaign: Campaign): void {
    this.lineCount = lines.length;
    this.lines.show(lines, campaign);
    this.refreshButtons();
  }

  setGone(gone: boolean): void {
    this.writing.setGone(gone);
  }

  private openEditAll(): void {
    this.writing.setShown(false);
    this.lines.setShown(false);
    this.editAll.open();
  }

  private editAllLeft(): void {
    this.writing.setShown(true);
    this.lines.setShown(true);
    this.writing.focus();
  }

  private wholeTextKept(path: string): void {
    if (path !== this.path) return;
    const waiting = this.needs.wholeText.drafts.draftOf(path) !== null;
    this.buttons.setEditsNotSaved(waiting);
    this.writing.setEditAllWaiting(waiting);
    this.refreshButtons();
  }

  private linesKept(path: string): void {
    if (path === this.path) this.refreshButtons();
  }

  private isSaving(): boolean {
    if (this.needs.drafts.isSaving(this.path)) return true;
    return this.needs.wholeText.drafts.isSaving(this.path);
  }

  private removalChanged(): void {
    this.writing.setRemoving(this.removal.isRunning);
    this.refreshButtons();
  }

  private refreshButtons(): void {
    this.buttons.setRemovable(this.lineCount, this.isSaving() || this.removal.isRunning);
  }
}
