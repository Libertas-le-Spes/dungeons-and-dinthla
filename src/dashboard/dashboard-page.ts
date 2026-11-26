import type { Campaign, Source, SourcedText } from "../campaign/record/campaign";
import { isInReferenceFolder, mainNotePathOf } from "../campaign/paths/campaign-folders";
import { characterReferenceKind } from "../kinds/character-reference-kind";
import type { CampaignStore } from "../campaign/reading/campaign-store";
import { latestNumberIsShared, latestSession, SESSIONS_SHARE_A_NUMBER } from "../campaign/paths/session-to-write";
import type { ThreadRecord } from "../campaign/threads/thread-kind";
import type { CharacterCard } from "../characters/cards/character-card";
import type { CharacterNotes } from "../characters/reading/character-notes";
import { ownCharacterFirst } from "../characters/cards/own-character-first";
import { learnedFactsOf } from "../characters/reading/learned-facts";
import { readCharacterCard } from "../characters/cards/read-character-card";
import type { CoinOutcome } from "../funds/coins/coin-dialog";
import { summariseFunds, type FundsSummary, type LedgerLine } from "../funds/page/funds-summary";
import { summariseItems } from "../funds/items/item-groups";
import { LedgerRow } from "../funds/page/rows/ledger-row";
import type { FollowUpName } from "../kinds/follow-up-name";
import { formatMoney } from "../notes/parts/money";
import type { LinkOpener } from "../views/components/rows/link-name";
import { scrollListParts } from "../views/components/layout/scroll-list";
import { HandleRequest, PressBinding } from "../views/elements/bindings/bindings";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import type { ElementBinding } from "../views/elements/bindings/element-binding";
import { RunAction } from "../views/elements/bindings/run-action";
import { Bold, Button, Div, Heading2, List, ListItem, PlainText, Section, Span } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";
import { NO_ROW, RowFocus, type FocusRow } from "../views/lists/row-focus";
import type { PageView, ShownPage } from "../views/pages/page-view";
import { ShownRows } from "../views/pages/shown-rows";
import type { ShownThreadKind } from "../views/threads/shown-thread-kind";
import { SHOWN_THREAD_KINDS } from "../views/threads/shown-thread-kinds";
import { listThreads } from "../views/threads/thread-list";
import type { ThreadOpeners } from "../views/threads/thread-openers";
import { ThreadRow } from "../views/threads/rows/thread-row";
import type { NewsLine } from "../whats-new/news-line";
import { everyLineOf, kindsWrittenIn, latestOfEachKind, type WrittenLineRows } from "./latest-session";
import { ItemEventRow, type ItemEventLine } from "./rows/item-event-row";
import { ShortCharacterCard } from "./rows/short-character-card";
import { PendingWork } from "../views/pending/pending-work";
import type { PropertiesSyntax } from "../campaign/paths/session-file";

const SHOWN_ROWS = 3;
const NO_SESSION = "No sessions yet.";
const NO_CHARACTERS = "No characters yet.";
const NO_COIN_ENTRIES = "No coin entries yet.";
const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-dashboard"];

export interface DashboardActions extends LinkOpener, ThreadOpeners {
  openLedgerEntry(source: Source, onClosed: (outcome: CoinOutcome) => void): void;
  openItem(name: string, source: Source, onClosed: (changed: boolean) => void): void;
  showFunds(): void;
  showCharacters(): void;
  openCharacterSheet(path: string): void;
  startSession(): void;
  writeNotes(path: string): void;
  sessionHeadingOf(path: string): string;
}

type AnyShownThread = ShownThreadKind<ThreadRecord, SourcedText, FollowUpName>;

class DashPanel {
  readonly title = new KeptHandle();
  readonly link = new KeptHandle();
  readonly count = new KeptHandle();
  readonly list = new KeptHandle();
  readonly rows = new ShownRows();
}

interface ThreadPanel {
  shown: AnyShownThread;
  panel: DashPanel;
}

function countWord(count: number, one: string, many: string): string {
  if (count === 1) return one;
  return many;
}

function emptyLine(text: string): ViewElement {
  return new ListItem({ cls: ["dd-empty"], text });
}

function countTrees(count: number, word: string, none: string): ViewElement[] {
  if (count === 0) return [new Span({ cls: ["dd-big-word"], text: none })];
  return [new PlainText(String(count)), new Span({ cls: ["dd-big-word"], text: word })];
}

class SessionRows implements WrittenLineRows {
  readonly built: ViewElement[] = [];

  constructor(private readonly page: DashboardPage) {}

  addThread<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(shown: ShownThreadKind<Thread, Ending, EndingName>, thread: Thread): void {
    this.built.push(this.page.threadRowIn(this.page.sessionPanel, shown, thread));
  }

  addLedgerLine(ledgerLine: LedgerLine): void {
    this.built.push(this.page.ledgerRowIn(this.page.sessionPanel, ledgerLine));
  }

  addItemEvent(itemEvent: ItemEventLine): void {
    this.built.push(this.page.itemRowIn(this.page.sessionPanel, itemEvent));
  }
}

export class DashboardPage implements ShownPage {
  readonly cls = PAGE_CLASSES;
  readonly sessionPanel = new DashPanel();
  private readonly threadPanels: ThreadPanel[];
  private readonly purse = new DashPanel();
  private readonly inOut = new KeptHandle();
  private readonly characters = new DashPanel();
  private readonly stops: (() => void)[] = [];
  private latestPath: string | null = null;
  private characterRenders = 0;
  private readonly characterDrawing = new PendingWork();
  private readonly rowFocus = new RowFocus();

  constructor(
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: DashboardActions,
    private readonly news: NewsLine,
    private readonly syntax: PropertiesSyntax,
  ) {
    this.threadPanels = SHOWN_THREAD_KINDS.map((shown) => ({ shown, panel: new DashPanel() }));
  }

  opened(view: PageView): void {
    const panels = [this.sessionTree(), ...this.threadPanels.map((threadPanel) => this.threadsTree(threadPanel)), this.purseTree(), this.charactersTree()];
    view.show([this.news.tree(), new Div({ cls: ["dd-dashboard-grid"] }, panels)]);
    this.stops.push(this.store.subscribe(this.render.bind(this)));
    this.stops.push(this.notes.onNoteChanged(this.noteChanged.bind(this)));
    this.render();
  }

  closed(): void {
    this.characterRenders += 1;
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  charactersDrawn(): Promise<void> {
    return this.characterDrawing.settled();
  }

  threadRowIn<Thread extends ThreadRecord, Ending extends SourcedText, EndingName extends FollowUpName>(
    panel: DashPanel,
    shown: ShownThreadKind<Thread, Ending, EndingName>,
    thread: Thread,
  ): ViewElement {
    const open = new RunAction(this.openThread.bind(this, panel, shown, thread.source));
    return new ThreadRow(shown, [], this.actions).build(thread, open, [new HandleRequest(panel.rows.handleFor(thread.source))]);
  }

  ledgerRowIn(panel: DashPanel, ledgerLine: LedgerLine): ViewElement {
    const source = ledgerLine.record.source;
    const open = new RunAction(this.openLedgerEntry.bind(this, panel, source));
    return new LedgerRow(this.actions).build(ledgerLine, open, [new HandleRequest(panel.rows.handleFor(source))]);
  }

  itemRowIn(panel: DashPanel, itemEvent: ItemEventLine): ViewElement {
    const source = itemEvent.event.source;
    const open = new RunAction(this.openItem.bind(this, panel, itemEvent.item.name, source));
    return new ItemEventRow().build(itemEvent, open, [new HandleRequest(panel.rows.handleFor(source))]);
  }

  private linkButton(text: string, pressed: () => void, handle: KeptHandle | null): ViewElement {
    const bindings: ElementBinding[] = [new PressBinding(new RunAction(pressed))];
    if (handle !== null) bindings.push(new HandleRequest(handle));
    return new Button({ cls: ["dd-panel-link"], text, bindings });
  }

  private headOf(title: string, panel: DashPanel, links: ViewElement[]): ViewElement {
    return new Div({ cls: ["dd-head"] }, [new Heading2({ cls: ["dd-title"], text: title, bindings: [new HandleRequest(panel.title)] }), new Div({ cls: ["dd-panel-links"] }, links)]);
  }

  private countTree(panel: DashPanel): ViewElement {
    return new Div({ cls: ["dd-big"], bindings: [new HandleRequest(panel.count)] });
  }

  private sessionTree(): ViewElement {
    const panel = this.sessionPanel;
    const links = [this.linkButton("New session", this.startSession.bind(this), null), this.linkButton("Write notes", this.writeInLatest.bind(this), panel.link)];
    const list = new List(scrollListParts({ cls: ["dd-list"], bindings: [new HandleRequest(panel.list)] }, "Lines written in this session"));
    return new Section({ cls: ["dd-panel"] }, [this.headOf("", panel, links), this.countTree(panel), list]);
  }

  private threadsTree({ shown, panel }: ThreadPanel): ViewElement {
    const links = [this.linkButton(shown.panelWords.link, this.showThreads.bind(this, shown), panel.link)];
    const list = new List({ cls: ["dd-list"], bindings: [new HandleRequest(panel.list)] });
    return new Section({ cls: ["dd-panel"] }, [this.headOf(shown.panelWords.title, panel, links), this.countTree(panel), list]);
  }

  private purseTree(): ViewElement {
    const panel = this.purse;
    const links = [this.linkButton("Party funds", this.showFunds.bind(this), panel.link)];
    const inOut = new Div({ cls: ["dd-in-out"], bindings: [new HandleRequest(this.inOut)] });
    const list = new List({ cls: ["dd-ledger"], bindings: [new HandleRequest(panel.list)] });
    return new Section({ cls: ["dd-panel"] }, [this.headOf("Purse", panel, links), this.countTree(panel), inOut, list]);
  }

  private charactersTree(): ViewElement {
    const panel = this.characters;
    const links = [this.linkButton("All characters", this.showCharacters.bind(this), panel.link)];
    const list = new List({ cls: ["dd-character-list"], bindings: [new HandleRequest(panel.list)] });
    return new Section({ cls: ["dd-panel", "dd-wide", "dd-characters"] }, [this.headOf("Characters", panel, links), list]);
  }

  private render(): void {
    const campaign = this.store.current;
    const funds = summariseFunds(campaign);
    for (const threadPanel of this.threadPanels) this.renderThreads(threadPanel, campaign);
    this.renderPurse(campaign, funds);
    this.renderSession(campaign, funds);
    this.redrawCharacters();
    this.rowFocus.afterRender();
  }

  private noteChanged(path: string): void {
    if (this.showsCharacterNote(path)) this.redrawCharacters();
  }

  private openThread(panel: DashPanel, shown: AnyShownThread, source: Source): void {
    shown.open(this.actions, source, this.afterClose.bind(this, panel, source));
  }

  private openLedgerEntry(panel: DashPanel, source: Source): void {
    this.actions.openLedgerEntry(source, this.afterLedgerEntry.bind(this, panel, source));
  }

  private openItem(panel: DashPanel, name: string, source: Source): void {
    this.actions.openItem(name, source, this.afterClose.bind(this, panel, source));
  }

  private afterLedgerEntry(panel: DashPanel, source: Source, outcome: CoinOutcome): void {
    let focusRow: FocusRow = panel.rows.focus.bind(panel.rows, source);
    if (outcome === "deleted") focusRow = NO_ROW;
    this.rowFocus.afterClose(focusRow, outcome !== "unchanged", panel.link.focus.bind(panel.link));
  }

  private afterClose(panel: DashPanel, source: Source, changed: boolean): void {
    this.rowFocus.afterClose(panel.rows.focus.bind(panel.rows, source), changed, panel.link.focus.bind(panel.link));
  }

  private renderThreads({ shown, panel }: ThreadPanel, campaign: Campaign): void {
    const contents = listThreads(shown, campaign, []);
    panel.count.showInside(countTrees(contents.openCount, shown.listWords.openWord, shown.panelWords.noneOpen));
    panel.rows.clear();
    panel.list.showInside(contents.open.slice(0, SHOWN_ROWS).map((thread) => this.threadRowIn(panel, shown, thread)));
  }

  private renderPurse(campaign: Campaign, funds: FundsSummary): void {
    const total: ViewElement[] = [new PlainText(formatMoney(funds.purse))];
    const held = summariseItems(campaign).heldCount;
    if (held > 0) total.push(new Span({ cls: ["dd-big-word"], text: `+ ${held} ${countWord(held, "item", "items")}` }));
    this.purse.count.showInside(total);
    this.inOut.showInside([new Span({ text: "In " }, [new Bold({ text: formatMoney(funds.totalIn) })]), new Span({ text: "Out " }, [new Bold({ text: formatMoney(funds.totalOut) })])]);
    this.purse.rows.clear();
    const rows = funds.ledger.slice(0, SHOWN_ROWS).map((line) => this.ledgerRowIn(this.purse, line));
    if (funds.ledger.length === 0) rows.push(emptyLine(NO_COIN_ENTRIES));
    this.purse.list.showInside(rows);
  }

  private renderSession(campaign: Campaign, funds: FundsSummary): void {
    const panel = this.sessionPanel;
    const folder = this.store.campaignFolder;
    const paths = this.store.sessionNotes.map((session) => session.path);
    let latest: string | null = null;
    if (folder !== null) latest = latestSession(folder, paths);
    this.latestPath = latest;
    panel.rows.clear();
    panel.link.setHidden(latest === null);
    if (latest === null) {
      panel.title.setText("Latest session");
      panel.count.showInside([]);
      let why = NO_SESSION;
      if (folder !== null && latestNumberIsShared(folder, paths)) why = SESSIONS_SHARE_A_NUMBER;
      panel.list.showInside([emptyLine(why)]);
      return;
    }
    panel.title.setText(this.actions.sessionHeadingOf(latest));
    const kinds = kindsWrittenIn(latest, campaign, funds.ledger);
    const lines = everyLineOf(kinds);
    panel.count.showInside(countTrees(lines.length, countWord(lines.length, "line", "lines"), "Nothing written yet"));
    const rows = new SessionRows(this);
    for (const line of latestOfEachKind(kinds)) line.addTo(rows);
    panel.list.showInside(rows.built);
  }

  private startSession(): void {
    this.actions.startSession();
  }

  private showFunds(): void {
    this.actions.showFunds();
  }

  private showCharacters(): void {
    this.actions.showCharacters();
  }

  private showThreads(shown: AnyShownThread): void {
    shown.show(this.actions);
  }

  private openCharacterSheet(path: string): void {
    this.actions.openCharacterSheet(path);
  }

  private writeInLatest(): void {
    if (this.latestPath === null) return;
    this.actions.writeNotes(this.latestPath);
  }

  private showsCharacterNote(path: string): boolean {
    const folder = this.store.campaignFolder;
    if (folder === null) return false;
    return path === mainNotePathOf(folder) || isInReferenceFolder(characterReferenceKind, folder, path);
  }

  private redrawCharacters(): void {
    this.characterDrawing.add(this.renderCharacters());
  }

  private async renderCharacters(): Promise<void> {
    const render = ++this.characterRenders;
    const cards = await this.characterCards();
    if (render !== this.characterRenders) return;
    const shown = ownCharacterFirst(cards).map((card) => this.cardRow(card));
    if (cards.length === 0) shown.push(emptyLine(NO_CHARACTERS));
    this.characters.list.showInside(shown);
  }

  private cardRow(card: CharacterCard): ViewElement {
    return new ShortCharacterCard().build(card, new RunAction(this.openCharacterSheet.bind(this, card.path)));
  }

  private async characterCards(): Promise<CharacterCard[]> {
    const folder = this.store.campaignFolder;
    if (folder === null) return [];
    const learned = learnedFactsOf(this.store.sessionNotes, this.notes);
    return Promise.all(this.notes.filesIn(folder).map((file) => readCharacterCard(file, learned, this.notes, this.syntax)));
  }
}
