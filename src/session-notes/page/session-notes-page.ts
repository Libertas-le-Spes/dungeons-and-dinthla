import { Component } from "obsidian";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER } from "../../campaign/paths/session-to-write";
import type { LookupOpeners } from "../../kinds/lookup-openers";
import type { NoteEditingNeeds } from "../../note-editing/note-editing";
import type { LinkActions } from "../../views/lists/linked-text";
import type { AppendWriter } from "../drafts/append-writer";
import type { Drafts } from "../drafts/drafts";
import type { KeptDrafts } from "../kept/kept-drafts";
import { KeptLines } from "../kept/kept-lines";
import { sessionChoiceOf, sessionChoicesOf, sessionShown, type PropertiesOf } from "./session-choices";
import { SessionPicker, type PickerMoves } from "./session-picker";
import type { RemovalTools } from "../removal/session-removal";
import { SessionWriting } from "./session-writing";
import { writtenLinesOf } from "../lines/written-lines";

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
  wholeText: NoteEditingNeeds;
  removal: RemovalTools;
}

export interface NotesMoves extends PickerMoves {
  stayOn(path: string): void;
  showNoSession(): void;
}

interface Drawn {
  path: string | null;
  picker: SessionPicker;
  gone: HTMLElement;
  kept: KeptLines;
  session: SessionWriting | null;
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
      this.drawn = { path, picker, gone, kept, session: null };
      this.update(this.drawn);
      return;
    }
    const session = new SessionWriting(
      root,
      path,
      { ...this.needs, campaign: () => this.needs.store.current },
      { heading: () => this.headingOf(path), deleted: (deleted) => this.sessionDeleted(deleted) },
    );
    this.drawn = { path, picker, gone, kept, session };
    this.update(this.drawn);
    session.focus();
  }

  private closeDrawn(): void {
    if (this.drawn === null) return;
    this.drawn.kept.close();
    if (this.drawn.session !== null) this.drawn.session.close();
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
    if (drawn.session === null || drawn.path === null) return;
    const store = this.needs.store;
    const note = store.sessionNotes.find((candidate) => candidate.path === drawn.path);
    if (note === undefined) {
      this.missing(drawn, drawn.session);
      return;
    }
    this.seen = true;
    this.copyTarget = drawn.path;
    drawn.gone.setText("");
    drawn.session.setGone(false);
    drawn.session.show(writtenLinesOf(note), store.current);
  }

  private missing(drawn: Drawn, session: SessionWriting): void {
    if (this.seen) {
      drawn.gone.setText(NOTE_GONE);
      session.setGone(true);
      return;
    }
    session.show([], this.needs.store.current);
  }

  private sessionDeleted(path: string): void {
    const store = this.needs.store;
    const left = store.sessionNotes.filter((session) => session.path !== path);
    const latest = sessionShown(null, store.campaignFolder, left);
    if (latest === null) {
      this.moves.showNoSession();
      return;
    }
    this.moves.showSession(latest);
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
