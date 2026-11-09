import { Component } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER } from "../campaign/session-to-write";
import type { LookupOpeners } from "../lookups/open-match";
import type { LinkActions } from "../views/linked-text";
import type { AppendWriter } from "./append-writer";
import type { Drafts } from "./drafts";
import type { KeptDrafts } from "./kept-drafts";
import { KeptLines } from "./kept-lines";
import { LinesList } from "./lines-list";
import { sessionChoiceOf, sessionChoicesOf, sessionShown, type PropertiesOf } from "./session-choices";
import { SessionPicker, type PickerMoves } from "./session-picker";
import { WritingPanel } from "./writing-panel";
import { writtenLinesOf } from "./written-lines";

const PAGE_TITLE = "Session notes";
const NO_SESSION = "No sessions yet. Start one to write in it.";
const NOTE_GONE = "This session's note was deleted, so nothing more can be saved to it. Lines typed in its box and not saved are kept below.";

export interface SessionNotesNeeds {
  store: CampaignStore;
  drafts: Drafts;
  keptDrafts: KeptDrafts;
  writer: AppendWriter;
  propertiesOf: PropertiesOf;
  openers: LookupOpeners;
  actions: LinkActions;
}

export interface NotesMoves extends PickerMoves {
  stayOn(path: string): void;
}

interface Drawn {
  path: string | null;
  picker: SessionPicker;
  gone: HTMLElement;
  kept: KeptLines;
  lines: LinesList | null;
  writing: WritingPanel | null;
}

export class SessionNotesPage extends Component {
  private drawn: Drawn | null = null;
  private chosen: string | null;
  private seen = false;
  private copyTarget: string | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    asked: string | null,
    private readonly needs: SessionNotesNeeds,
    private readonly moves: NotesMoves,
  ) {
    super();
    this.chosen = asked;
  }

  override onload(): void {
    this.contentEl.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-session-notes");
    this.register(this.needs.store.subscribe(() => this.campaignChanged()));
    this.register(() => this.closeDrawn());
    this.draw();
  }

  private sessionToShow(): string | null {
    const store = this.needs.store;
    const path = sessionShown(this.chosen, store.campaignFolder, store.sessionNotes);
    if (this.chosen === null && path !== null) this.stayOn(path);
    return path;
  }

  private stayOn(path: string): void {
    this.chosen = path;
    this.moves.stayOn(path);
  }

  private campaignChanged(): void {
    const drawn = this.drawn;
    if (drawn === null || drawn.path !== this.sessionToShow()) {
      this.draw();
      return;
    }
    this.update(drawn);
  }

  private draw(): void {
    this.closeDrawn();
    const root = this.contentEl;
    root.empty();
    const path = this.sessionToShow();
    const picker = new SessionPicker(root, this.moves);
    const gone = root.createEl("p", { cls: "dd-note-gone", attr: { "aria-live": "polite" } });
    const kept = new KeptLines(root, this.needs.drafts, this.needs.keptDrafts, () => this.copyTarget);
    if (path === null) {
      root.createEl("p", { cls: "dd-empty", text: this.noSessionText() });
      this.drawn = { path, picker, gone, kept, lines: null, writing: null };
      this.update(this.drawn);
      return;
    }
    const writing = new WritingPanel(root, path, { ...this.needs, campaign: () => this.needs.store.current });
    this.drawn = { path, picker, gone, kept, lines: new LinesList(root, this.needs.actions), writing };
    this.update(this.drawn);
    writing.focus();
  }

  private closeDrawn(): void {
    if (this.drawn === null) return;
    this.drawn.kept.close();
    if (this.drawn.writing !== null) this.drawn.writing.close();
  }

  private update(drawn: Drawn): void {
    const store = this.needs.store;
    const choices = sessionChoicesOf(store.sessionNotes, this.needs.propertiesOf);
    drawn.picker.show(this.headingOf(drawn.path), choices, drawn.path);
    this.showSession(drawn);
    drawn.kept.refresh();
  }

  private showSession(drawn: Drawn): void {
    this.copyTarget = null;
    if (drawn.lines === null || drawn.writing === null || drawn.path === null) return;
    const store = this.needs.store;
    const session = store.sessionNotes.find((candidate) => candidate.path === drawn.path);
    if (session === undefined) {
      this.missing(drawn, drawn.lines, drawn.writing);
      return;
    }
    this.seen = true;
    this.copyTarget = drawn.path;
    drawn.gone.setText("");
    drawn.writing.setGone(false);
    drawn.lines.show(writtenLinesOf(session), store.current);
  }

  private missing(drawn: Drawn, lines: LinesList, writing: WritingPanel): void {
    if (this.seen) {
      drawn.gone.setText(NOTE_GONE);
      writing.setGone(true);
      return;
    }
    lines.show([], this.needs.store.current);
  }

  private headingOf(path: string | null): string {
    if (path === null) return PAGE_TITLE;
    return sessionChoiceOf(path, this.needs.propertiesOf).heading;
  }

  private noSessionText(): string {
    const store = this.needs.store;
    const folder = store.campaignFolder;
    const paths = store.sessionNotes.map((session) => session.path);
    if (folder !== null && latestNumberIsShared(folder, paths)) return SESSIONS_SHARE_A_NUMBER;
    return NO_SESSION;
  }
}
