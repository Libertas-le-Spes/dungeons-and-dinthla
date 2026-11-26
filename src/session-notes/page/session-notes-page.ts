import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER } from "../../campaign/paths/session-to-write";
import type { LookupOpeners } from "../../kinds/lookup-openers";
import type { NoteEditingNeeds } from "../../note-editing/note-editing";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { PageView, ShownPage } from "../../views/pages/page-view";
import type { WantedLines } from "../../views/opening/wanted-lines";
import type { LineOpeners } from "../lines/line-opener-of";
import type { AppendWriter } from "../drafts/append-writer";
import type { Drafts } from "../drafts/drafts";
import type { KeptDrafts } from "../kept/kept-drafts";
import { KeptLines } from "../kept/kept-lines";
import { sessionChoiceOf, sessionChoicesOf, sessionShown, type PropertiesOf } from "./session-choices";
import { SessionPicker, type PickerMoves } from "./session-picker";
import type { RemovalTools } from "../removal/session-removal";
import { SessionWriting } from "./session-writing";
import { writtenLinesOf } from "../lines/written-lines";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

const PAGE_TITLE = "Session notes";
const NO_SESSION = "No sessions yet.";
const NOTE_GONE = "This session's note was deleted. Unsaved lines are kept below.";
const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-session-notes"];

export interface SessionNotesNeeds {
  store: CampaignStore;
  drafts: Drafts;
  keptDrafts: KeptDrafts;
  writer: AppendWriter;
  propertiesOf: PropertiesOf;
  openers: LookupOpeners;
  actions: LinkOpener;
  lineOpeners: LineOpeners;
  wholeText: NoteEditingNeeds;
  removal: RemovalTools;
  wantedLines: WantedLines;
}

export interface NotesMoves extends PickerMoves {
  stayOn(path: string): void;
  showNoSession(): void;
}

interface Drawn {
  path: string | null;
  picker: SessionPicker;
  gone: KeptHandle;
  kept: KeptLines;
  session: SessionWriting | null;
}

export class SessionNotesPage implements ShownPage {
  readonly cls = PAGE_CLASSES;
  private view: PageView | null = null;
  private readonly stops: (() => void)[] = [];
  private drawn: Drawn | null = null;
  private chosen: string | null;
  private seen = false;
  private copyTarget: string | null = null;

  constructor(
    asked: string | null,
    private readonly needs: SessionNotesNeeds,
    private readonly moves: NotesMoves,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.chosen = asked;
  }

  opened(view: PageView): void {
    this.view = view;
    this.stops.push(this.needs.store.subscribe(this.campaignChanged.bind(this)), this.needs.wantedLines.subscribe(this.lineWanted.bind(this)));
    this.draw();
  }

  closed(): void {
    for (const stop of this.stops) stop();
    this.stops.length = 0;
    this.closeDrawn();
    this.view = null;
  }

  async settled(): Promise<void> {
    const drawn = this.drawn;
    if (drawn === null) return;
    if (drawn.session === null) return;
    await drawn.session.settled();
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
    const view = this.view;
    if (view === null) return;
    this.closeDrawn();
    const path = this.sessionToShow();
    const picker = new SessionPicker(this.moves);
    const gone = new KeptHandle();
    const kept = new KeptLines(this.needs.drafts, this.needs.keptDrafts, this.copyTargetNow.bind(this));
    const trees: ViewElement[] = [picker.tree(), new Paragraph({ cls: ["dd-note-gone"], live: "polite", bindings: [new HandleRequest(gone)] }), kept.tree()];
    if (path === null) {
      trees.push(new Paragraph({ cls: ["dd-empty"], text: this.noSessionText() }));
      view.show(trees);
      kept.start();
      this.drawn = { path, picker, gone, kept, session: null };
      this.update(this.drawn);
      return;
    }
    const session = new SessionWriting(
      path,
      { ...this.needs, campaign: () => this.needs.store.current },
      { heading: () => this.headingOf(path), deleted: (latest) => this.sessionDeleted(latest) },
      this.syntax,
    );
    view.show([...trees, ...session.trees()]);
    kept.start();
    session.start();
    this.drawn = { path, picker, gone, kept, session };
    this.update(this.drawn);
    session.focus();
  }

  private copyTargetNow(): string | null {
    return this.copyTarget;
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
    this.revealWanted(drawn.session, drawn.path);
  }

  private lineWanted(): void {
    const drawn = this.drawn;
    if (drawn === null) return;
    this.showSession(drawn);
  }

  private revealWanted(session: SessionWriting, path: string): void {
    const line = this.needs.wantedLines.takeFor(path);
    if (line === null) return;
    session.reveal(line);
  }

  private missing(drawn: Drawn, session: SessionWriting): void {
    if (this.seen) {
      drawn.gone.setText(NOTE_GONE);
      session.setGone(true);
      return;
    }
    session.show([], this.needs.store.current);
  }

  private sessionDeleted(latest: string | null): void {
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
