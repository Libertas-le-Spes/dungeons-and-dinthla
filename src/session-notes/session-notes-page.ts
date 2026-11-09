import { Component } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER } from "../campaign/session-to-write";
import type { LookupOpeners } from "../lookups/open-match";
import type { LinkActions } from "../views/linked-text";
import type { AppendWriter } from "./append-writer";
import type { Drafts } from "./drafts";
import { LinesList } from "./lines-list";
import { sessionChoiceOf, sessionChoicesOf, sessionShown, type PropertiesOf } from "./session-choices";
import { SessionPicker, type PickerMoves } from "./session-picker";
import { WritingPanel } from "./writing-panel";
import { writtenLinesOf } from "./written-lines";

const PAGE_TITLE = "Session notes";
const NO_SESSION = "No sessions yet. Start one to write in it.";

export interface SessionNotesNeeds {
  store: CampaignStore;
  drafts: Drafts;
  writer: AppendWriter;
  propertiesOf: PropertiesOf;
  openers: LookupOpeners;
  actions: LinkActions;
}

interface Drawn {
  path: string | null;
  picker: SessionPicker;
  lines: LinesList | null;
}

export class SessionNotesPage extends Component {
  private drawn: Drawn | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly asked: string | null,
    private readonly needs: SessionNotesNeeds,
    private readonly moves: PickerMoves,
  ) {
    super();
  }

  override onload(): void {
    this.contentEl.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-session-notes");
    this.register(this.needs.store.subscribe(() => this.campaignChanged()));
    this.draw();
  }

  private shownPath(): string | null {
    const store = this.needs.store;
    return sessionShown(this.asked, store.campaignFolder, store.sessionNotes);
  }

  private campaignChanged(): void {
    const drawn = this.drawn;
    if (drawn === null || drawn.path !== this.shownPath()) {
      this.draw();
      return;
    }
    this.update(drawn);
  }

  private draw(): void {
    const root = this.contentEl;
    root.empty();
    const path = this.shownPath();
    const picker = new SessionPicker(root, this.moves);
    if (path === null) {
      root.createEl("p", { cls: "dd-empty", text: this.noSessionText() });
      this.drawn = { path, picker, lines: null };
      this.update(this.drawn);
      return;
    }
    const writing = new WritingPanel(root, path, { ...this.needs, campaign: () => this.needs.store.current });
    this.drawn = { path, picker, lines: new LinesList(root, this.needs.actions) };
    this.update(this.drawn);
    writing.focus();
  }

  private update(drawn: Drawn): void {
    const store = this.needs.store;
    const choices = sessionChoicesOf(store.sessionNotes, this.needs.propertiesOf);
    drawn.picker.show(this.headingOf(drawn.path), choices, drawn.path);
    if (drawn.lines === null || drawn.path === null) return;
    const session = store.sessionNotes.find((candidate) => candidate.path === drawn.path);
    if (session === undefined) drawn.lines.show([], store.current);
    else drawn.lines.show(writtenLinesOf(session), store.current);
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
