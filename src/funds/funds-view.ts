import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { formatMoney } from "../notes/money";
import { addNameLink, addRowButton, type LinkActions } from "../views/linked-text";
import type { ItemEventKind, ItemRecord, Source } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { summariseFunds, type CoinCount, type FundsSummary, type LedgerLine } from "./funds-summary";
import { summariseItems, THE_PARTY_LABEL, type ItemSummary } from "./item-groups";
import type { CoinOutcome } from "./coin-modal";
import { addLedgerRow, NO_COIN_ENTRIES } from "./ledger-row";
import { focusRowAt, PENDING_FOCUS_MS } from "../views/row-focus";

export const FUNDS_VIEW = "dungeons-and-dinthla-funds";

const HOW_LINES_ARE_READ =
  "A $ line with an amount is coin; without one, it is an item. An amount is money out when it has a minus sign, or when “paid”, “spent”, “bought”, “gave” or “lost” comes before it with no comma between. A plus sign keeps it in.";

function coinText({ kind, count }: CoinCount): string {
  const written = Math.abs(count).toLocaleString("en");
  if (count < 0) return `−${written} ${kind}`;
  return `${written} ${kind}`;
}

const NO_ITEMS = "No items held. A $ line without an amount, like “$ [[Mira]] Flame Tongue longsword”, adds one.";
type GoneKind = "sold" | "used" | "lost";

const GONE_WORDS: Record<GoneKind, string> = { sold: "Sold", used: "Used up", lost: "Lost" };

function isGoneKind(kind: ItemEventKind): kind is GoneKind {
  return kind in GONE_WORDS;
}

function goneWordOf(item: ItemRecord): string | null {
  if (item.gone === null || !isGoneKind(item.gone.kind)) return null;
  return GONE_WORDS[item.gone.kind];
}

function rowSourceOf(item: ItemRecord): Source {
  if (item.gone === null) return item.source;
  return item.gone.source;
}

function isSaleLogged(item: ItemRecord, ledger: LedgerLine[]): boolean {
  if (item.gone === null) return false;
  const { path, line } = item.gone.source;
  return ledger.some(({ record }) => record.source.path === path && record.source.line === line);
}

function heldText(count: number): string {
  if (count === 0) return "";
  return `${count} held`;
}

function entriesText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 entry";
  return `${count} entries`;
}

export class FundsView extends ItemView {
  private purse!: HTMLElement;
  private items!: HTMLElement;
  private ledgerCount!: HTMLElement;
  private ledgerList!: HTMLElement;
  private addCoinButton: HTMLElement | null = null;
  private pendingFocus: { source: Source | null; until: number } | null = null;
  private pendingItem: { name: string; until: number } | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly actions: LinkActions,
    private readonly noteExists: (name: string, sourcePath: string) => boolean,
    private readonly addCoin: ((returnFocus: () => void) => void) | null,
    private readonly openEntry: ((source: Source, onClosed: (outcome: CoinOutcome) => void) => void) | null,
    private readonly openItem: ((name: string, source: Source, onClosed: (changed: boolean) => void) => void) | null,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return FUNDS_VIEW;
  }

  getDisplayText(): string {
    return "Party funds";
  }

  override getIcon(): string {
    return "coins";
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-funds");
    this.purse = root.createEl("section", { cls: "dd-panel dd-purse-panel" });
    this.items = root.createEl("section", { cls: "dd-panel dd-items-panel" });
    this.buildLedger(root.createEl("section", { cls: "dd-panel dd-ledger-panel" }));
    this.register(this.store.subscribe(() => this.render()));
    this.render();
  }

  private render(): void {
    const summary = summariseFunds(this.store.current);
    this.renderPurse(summary);
    this.renderItems(summariseItems(this.store.current), summary.ledger);
    this.renderLedger(summary.ledger);
  }

  private renderPurse(summary: FundsSummary): void {
    this.purse.empty();
    this.purse.createEl("h2", { cls: "dd-title", text: "Purse" });
    this.purse.createDiv({ cls: "dd-purse", text: formatMoney(summary.purse) });
    const coins = this.purse.createDiv({ cls: "dd-coins" });
    const chips = summary.coinCounts.map(coinText);
    if (summary.ledger.length === 0) {
      coins.createSpan({ cls: "dd-empty", text: "No coin yet. Note it as “$ 20 gp from …”." });
    } else if (chips.join(" ") !== formatMoney(summary.purse)) {
      coins.createSpan({ cls: "dd-coins-label", text: "In coins:" });
      for (const chip of chips) coins.createSpan({ cls: "dd-coin", text: chip });
    }
    const inOut = this.purse.createDiv({ cls: "dd-in-out" });
    inOut.createSpan({ text: "In " }).createEl("b", { text: formatMoney(summary.totalIn) });
    inOut.createSpan({ text: "Out " }).createEl("b", { text: formatMoney(summary.totalOut) });
  }

  private renderItems(summary: ItemSummary, ledger: LedgerLine[]): void {
    this.items.empty();
    const title = this.items.createEl("h2", { cls: "dd-title", text: "Items" });
    title.createSpan({ cls: "dd-count", text: heldText(summary.heldCount) });
    if (summary.groups.length === 0) this.items.createEl("p", { cls: "dd-empty", text: NO_ITEMS });
    for (const group of summary.groups) {
      const heading = this.items.createEl("h3", { cls: "dd-holder" });
      const sourcePath = group.items[0]!.source.path;
      if (group.holder === "") heading.setText(THE_PARTY_LABEL);
      else if (this.noteExists(group.holder, sourcePath)) addNameLink(heading, group.holder, group.holder, sourcePath, this.actions);
      else heading.setText(group.holder);
      const list = this.items.createEl("ul", { cls: "dd-list" });
      for (const item of group.items) this.addItemRow(list, item, ledger);
    }
    const folded = this.items.createEl("details", { cls: "dd-folded" });
    folded.createEl("summary", { text: "Gone" }).createSpan({ cls: "dd-count", text: String(summary.gone.length) });
    const gone = folded.createEl("ul", { cls: "dd-list" });
    if (summary.gone.length === 0) gone.createEl("li", { cls: "dd-empty", text: "Nothing sold, used or lost yet." });
    for (const item of summary.gone) this.addItemRow(gone, item, ledger);
    this.focusPendingItem();
  }

  private focusItemRow(name: string): void {
    const rows = Array.from(this.items.querySelectorAll<HTMLElement>(".dd-row"));
    const row = rows.find((candidate) => candidate.dataset.item === name);
    if (row === undefined) return;
    const folded = row.closest("details");
    if (folded !== null) folded.open = true;
    row.focus();
  }

  private focusPendingItem(): void {
    const pending = this.pendingItem;
    this.pendingItem = null;
    if (pending === null || Date.now() > pending.until) return;
    this.focusItemRow(pending.name);
  }

  private afterItem(name: string, changed: boolean): void {
    this.pendingItem = null;
    if (!changed) {
      this.focusItemRow(name);
      return;
    }
    this.pendingItem = { name, until: Date.now() + PENDING_FOCUS_MS };
  }

  private addItemRow(list: HTMLElement, item: ItemRecord, ledger: LedgerLine[]): void {
    const source = rowSourceOf(item);
    let actions = this.actions;
    const openItem = this.openItem;
    if (openItem !== null) {
      actions = { ...this.actions, openRow: () => openItem(item.name, source, (changed) => this.afterItem(item.name, changed)) };
    }
    const row = addRowButton(list, source, actions);
    row.dataset.item = item.name;
    const goneWord = goneWordOf(item);
    if (goneWord === null) row.createSpan({ cls: "dd-mark dd-mark-ledger", text: "$" });
    else row.createSpan({ cls: "dd-mark dd-mark-gone", text: "✕", attr: { "aria-label": goneWord } });
    const body = row.createSpan({ cls: "dd-body" });
    const name = body.createSpan({ cls: "dd-text", text: item.name });
    const meta = body.createSpan({ cls: "dd-meta" });
    if (goneWord !== null) {
      name.addClass("dd-gone");
      meta.appendText(goneWord);
      if (isSaleLogged(item, ledger)) meta.appendText(" · sale in the ledger");
      meta.appendText(" · ");
    }
    meta.appendText(sessionLabelOf(source.path));
  }

  private buildLedger(panel: HTMLElement): void {
    const head = panel.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Ledger" });
    this.ledgerCount = title.createSpan({ cls: "dd-count" });
    const addCoin = this.addCoin;
    if (addCoin !== null) {
      const button = head.createEl("button", { cls: "dd-create", text: "Add coin" });
      this.registerDomEvent(button, "click", () => addCoin(() => button.focus()));
      this.addCoinButton = button;
    }
    this.ledgerList = panel.createEl("ul", { cls: "dd-ledger" });
    panel.createEl("p", { cls: "dd-note", text: HOW_LINES_ARE_READ });
  }

  private renderLedger(lines: LedgerLine[]): void {
    this.ledgerCount.setText(entriesText(lines.length));
    this.ledgerList.empty();
    if (lines.length === 0) this.ledgerList.createEl("li", { cls: "dd-empty", text: NO_COIN_ENTRIES });
    for (const line of lines) this.addLedgerRow(this.ledgerList, line);
    this.focusPending();
  }

  private focusPending(): void {
    const pending = this.pendingFocus;
    this.pendingFocus = null;
    if (pending === null || Date.now() > pending.until) return;
    if (pending.source !== null && focusRowAt(this.ledgerList, pending.source)) return;
    if (this.addCoinButton !== null) this.addCoinButton.focus();
  }

  private afterEntry(source: Source, outcome: CoinOutcome): void {
    this.pendingFocus = null;
    if (outcome === "unchanged") {
      focusRowAt(this.ledgerList, source);
      return;
    }
    let focused: Source | null = source;
    if (outcome === "deleted") focused = null;
    this.pendingFocus = { source: focused, until: Date.now() + PENDING_FOCUS_MS };
  }

  private soldAt(source: Source): ItemRecord | undefined {
    return this.store.current.items.find(
      (item) => item.gone !== null && item.gone.source.path === source.path && item.gone.source.line === source.line,
    );
  }

  private afterSale(source: Source, changed: boolean): void {
    let outcome: CoinOutcome = "unchanged";
    if (changed) outcome = "written";
    this.afterEntry(source, outcome);
  }

  private addLedgerRow(list: HTMLElement, line: LedgerLine): void {
    const { record } = line;
    let actions = this.actions;
    const openEntry = this.openEntry;
    const openItem = this.openItem;
    const sold = this.soldAt(record.source);
    if (sold !== undefined && openItem !== null) {
      actions = { ...this.actions, openRow: (source: Source) => openItem(sold.name, source, (changed) => this.afterSale(source, changed)) };
    } else if (openEntry !== null) {
      actions = { ...this.actions, openRow: (source: Source) => openEntry(source, (outcome) => this.afterEntry(source, outcome)) };
    }
    addLedgerRow(list, line, actions, this.actions);
  }
}
