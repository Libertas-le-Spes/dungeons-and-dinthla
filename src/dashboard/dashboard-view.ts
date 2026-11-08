import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { Campaign, Source } from "../campaign/campaign";
import { charactersFolderOf, mainNotePathOf } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import { latestNumberIsShared, latestSession, SESSIONS_SHARE_A_NUMBER } from "../campaign/session-to-write";
import type { CharacterCard } from "../characters/character-card";
import type { CharacterNotes } from "../characters/character-notes";
import { learnedFactsOf, readCharacterCard } from "../characters/read-character-card";
import type { CoinOutcome } from "../funds/coin-modal";
import { summariseFunds, type FundsSummary } from "../funds/funds-summary";
import { summariseItems } from "../funds/item-groups";
import { addLedgerRow, NO_COIN_ENTRIES } from "../funds/ledger-row";
import { formatMoney } from "../notes/money";
import { listQuestions } from "../questions/question-list";
import { addQuestionRow } from "../questions/question-row";
import { listQuests } from "../quests/quest-list";
import { addQuestRow } from "../quests/quest-row";
import type { LinkActions } from "../views/linked-text";
import { focusRowAt, NO_ROW, RowFocus, type FocusRow } from "../views/row-focus";
import { linesWrittenIn, type WrittenLine } from "./latest-session";
import { addShortCharacterCard } from "./short-character-card";

export const DASHBOARD_VIEW = "dungeons-and-dinthla-dashboard";

const SHOWN_ROWS = 3;
const SHOWN_SESSION_LINES = 4;
const NO_SESSION = "No sessions yet. Start one to write in it.";
const NO_CHARACTERS = "No characters yet. A note in the campaign’s Characters folder adds one.";

export interface DashboardActions extends LinkActions {
  openQuestion(source: Source, onClosed: (changed: boolean) => void): void;
  openQuest(source: Source, onClosed: (changed: boolean) => void): void;
  openLedgerEntry(source: Source, onClosed: (outcome: CoinOutcome) => void): void;
  showQuestions(): void;
  showQuests(): void;
  showFunds(): void;
  showCharacters(): void;
  startSession(): void;
  sessionHeadingOf(path: string): string;
}

interface Panel {
  section: HTMLElement;
  title: HTMLElement;
  links: HTMLElement;
  link: HTMLElement;
}

type OpenRow = (source: Source, onClosed: (changed: boolean) => void) => void;

function countWord(count: number, one: string, many: string): string {
  if (count === 1) return one;
  return many;
}

export class DashboardView extends ItemView {
  private questions!: Panel;
  private questionCount!: HTMLElement;
  private questionList!: HTMLElement;
  private quests!: Panel;
  private questCount!: HTMLElement;
  private questList!: HTMLElement;
  private purse!: Panel;
  private purseTotal!: HTMLElement;
  private inOut!: HTMLElement;
  private ledgerList!: HTMLElement;
  private characters!: Panel;
  private characterList!: HTMLElement;
  private session!: Panel;
  private sessionCount!: HTMLElement;
  private sessionList!: HTMLElement;
  private latestPath: string | null = null;
  private characterRenders = 0;
  private readonly rowFocus = new RowFocus();

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly notes: CharacterNotes,
    private readonly actions: DashboardActions,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return DASHBOARD_VIEW;
  }

  getDisplayText(): string {
    return "Dashboard";
  }

  override getIcon(): string {
    return "layout-dashboard";
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-dashboard");
    const grid = root.createDiv({ cls: "dd-dashboard-grid" });
    this.buildQuestions(grid);
    this.buildQuests(grid);
    this.buildPurse(grid);
    this.buildCharacters(grid);
    this.buildSession(grid);
    this.register(this.store.subscribe(() => this.render()));
    this.register(
      this.notes.onNoteChanged((path) => {
        if (this.showsCharacterNote(path)) void this.renderCharacters();
      }),
    );
    this.render();
  }

  private addPanel(grid: HTMLElement, title: string, linkText: string, show: () => void): Panel {
    const section = grid.createEl("section", { cls: "dd-panel" });
    const head = section.createDiv({ cls: "dd-head" });
    const heading = head.createEl("h2", { cls: "dd-title", text: title });
    const links = head.createDiv({ cls: "dd-panel-links" });
    const link = links.createEl("button", { cls: "dd-panel-link", text: linkText });
    this.registerDomEvent(link, "click", () => show());
    return { section, title: heading, links, link };
  }

  private buildQuestions(grid: HTMLElement): void {
    this.questions = this.addPanel(grid, "Open questions", "All questions", () => this.actions.showQuestions());
    this.questionCount = this.questions.section.createDiv({ cls: "dd-big" });
    this.questionList = this.questions.section.createEl("ul", { cls: "dd-list" });
  }

  private buildQuests(grid: HTMLElement): void {
    this.quests = this.addPanel(grid, "Active quests", "All quests", () => this.actions.showQuests());
    this.questCount = this.quests.section.createDiv({ cls: "dd-big" });
    this.questList = this.quests.section.createEl("ul", { cls: "dd-list" });
  }

  private buildPurse(grid: HTMLElement): void {
    this.purse = this.addPanel(grid, "Purse", "Party funds", () => this.actions.showFunds());
    this.purseTotal = this.purse.section.createDiv({ cls: "dd-big" });
    this.inOut = this.purse.section.createDiv({ cls: "dd-in-out" });
    this.ledgerList = this.purse.section.createEl("ul", { cls: "dd-ledger" });
  }

  private buildCharacters(grid: HTMLElement): void {
    this.characters = this.addPanel(grid, "Characters", "All characters", () => this.actions.showCharacters());
    this.characters.section.addClass("dd-wide", "dd-characters");
    this.characterList = this.characters.section.createEl("ul", { cls: "dd-character-list" });
  }

  private buildSession(grid: HTMLElement): void {
    this.session = this.addPanel(grid, "", "Write notes", () => this.writeInLatest());
    const newSession = this.session.links.createEl("button", { cls: "dd-panel-link", text: "New session", prepend: true });
    this.registerDomEvent(newSession, "click", () => this.actions.startSession());
    this.sessionCount = this.session.section.createDiv({ cls: "dd-big" });
    this.sessionList = this.session.section.createEl("ul", { cls: "dd-list" });
  }

  private render(): void {
    const campaign = this.store.current;
    const funds = summariseFunds(campaign);
    this.renderQuestions(campaign);
    this.renderQuests(campaign);
    this.renderPurse(campaign, funds);
    this.renderSession(campaign, funds);
    void this.renderCharacters();
    this.rowFocus.afterRender();
  }

  private showCount(element: HTMLElement, count: number, word: string, none: string): void {
    element.empty();
    if (count === 0) {
      element.createSpan({ cls: "dd-big-word", text: none });
      return;
    }
    element.appendText(String(count));
    element.createSpan({ cls: "dd-big-word", text: word });
  }

  private rowActions(panel: Panel, open: OpenRow): LinkActions {
    return {
      ...this.actions,
      openRow: (source: Source) => open(source, (changed) => this.afterClose(panel, () => focusRowAt(panel.section, source), changed)),
    };
  }

  private ledgerActions(panel: Panel): LinkActions {
    return {
      ...this.actions,
      openRow: (source: Source) => this.actions.openLedgerEntry(source, (outcome) => this.afterLedgerEntry(panel, source, outcome)),
    };
  }

  private afterLedgerEntry(panel: Panel, source: Source, outcome: CoinOutcome): void {
    let focusRow = () => focusRowAt(panel.section, source);
    if (outcome === "deleted") focusRow = NO_ROW;
    this.afterClose(panel, focusRow, outcome !== "unchanged");
  }

  private afterClose(panel: Panel, focusRow: FocusRow, changed: boolean): void {
    this.rowFocus.afterClose(focusRow, changed, () => panel.link.focus());
  }

  private renderQuestions(campaign: Campaign): void {
    const contents = listQuestions(campaign, []);
    this.showCount(this.questionCount, contents.openCount, "open", "Nothing open");
    this.questionList.empty();
    const actions = this.rowActions(this.questions, (source, onClosed) => this.actions.openQuestion(source, onClosed));
    for (const question of contents.open.slice(0, SHOWN_ROWS)) addQuestionRow(this.questionList, question, [], actions);
  }

  private renderQuests(campaign: Campaign): void {
    const contents = listQuests(campaign, []);
    this.showCount(this.questCount, contents.openCount, "active", "No active quests");
    this.questList.empty();
    const actions = this.rowActions(this.quests, (source, onClosed) => this.actions.openQuest(source, onClosed));
    for (const quest of contents.open.slice(0, SHOWN_ROWS)) addQuestRow(this.questList, quest, [], actions);
  }

  private renderPurse(campaign: Campaign, funds: FundsSummary): void {
    this.purseTotal.empty();
    this.purseTotal.appendText(formatMoney(funds.purse));
    const held = summariseItems(campaign).heldCount;
    if (held > 0) this.purseTotal.createSpan({ cls: "dd-big-word", text: `+ ${held} ${countWord(held, "item", "items")}` });
    this.inOut.empty();
    this.inOut.createSpan({ text: "In " }).createEl("b", { text: formatMoney(funds.totalIn) });
    this.inOut.createSpan({ text: "Out " }).createEl("b", { text: formatMoney(funds.totalOut) });
    this.ledgerList.empty();
    if (funds.ledger.length === 0) this.ledgerList.createEl("li", { cls: "dd-empty", text: NO_COIN_ENTRIES });
    const actions = this.ledgerActions(this.purse);
    for (const line of funds.ledger.slice(0, SHOWN_ROWS)) addLedgerRow(this.ledgerList, line, actions, this.actions);
  }

  private renderSession(campaign: Campaign, funds: FundsSummary): void {
    const folder = this.store.campaignFolder;
    const paths = this.store.sessionNotes.map((session) => session.path);
    let latest: string | null = null;
    if (folder !== null) latest = latestSession(folder, paths);
    this.latestPath = latest;
    this.sessionList.empty();
    this.session.link.toggle(latest !== null);
    if (latest === null) {
      this.session.title.setText("Latest session");
      this.sessionCount.empty();
      let why = NO_SESSION;
      if (folder !== null && latestNumberIsShared(folder, paths)) why = SESSIONS_SHARE_A_NUMBER;
      this.sessionList.createEl("li", { cls: "dd-empty", text: why });
      return;
    }
    this.session.title.setText(this.actions.sessionHeadingOf(latest));
    const lines = linesWrittenIn(latest, campaign, funds.ledger);
    this.showCount(this.sessionCount, lines.length, countWord(lines.length, "line", "lines"), "Nothing written yet");
    for (const line of lines.slice(0, SHOWN_SESSION_LINES)) this.addWrittenLine(line);
  }

  private addWrittenLine(line: WrittenLine): void {
    const panel = this.session;
    if (line.kind === "question") {
      const actions = this.rowActions(panel, (source, onClosed) => this.actions.openQuestion(source, onClosed));
      addQuestionRow(this.sessionList, line.question, [], actions);
    } else if (line.kind === "quest") {
      const actions = this.rowActions(panel, (source, onClosed) => this.actions.openQuest(source, onClosed));
      addQuestRow(this.sessionList, line.quest, [], actions);
    } else {
      addLedgerRow(this.sessionList, line.ledgerLine, this.ledgerActions(panel), this.actions);
    }
  }

  private writeInLatest(): void {
    if (this.latestPath === null) return;
    this.actions.openRow({ path: this.latestPath, line: 0 });
  }

  private showsCharacterNote(path: string): boolean {
    const folder = this.store.campaignFolder;
    if (folder === null) return false;
    return path === mainNotePathOf(folder) || path.startsWith(`${charactersFolderOf(folder)}/`);
  }

  private async renderCharacters(): Promise<void> {
    const render = ++this.characterRenders;
    const cards = await this.characterCards();
    if (render !== this.characterRenders) return;
    this.characterList.empty();
    if (cards.length === 0) this.characterList.createEl("li", { cls: "dd-empty", text: NO_CHARACTERS });
    for (const card of cards) addShortCharacterCard(this.characterList, card, this.actions);
  }

  private async characterCards(): Promise<CharacterCard[]> {
    const folder = this.store.campaignFolder;
    if (folder === null) return [];
    const learned = learnedFactsOf(this.store.sessionNotes, this.notes);
    return Promise.all(this.notes.filesIn(folder).map((file) => readCharacterCard(file, learned, this.notes)));
  }
}
