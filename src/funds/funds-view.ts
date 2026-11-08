import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { formatMoney } from "../notes/money";
import { addLinkedText, addNameLink, addRowButton, type LinkActions } from "../views/linked-text";
import type { ItemEventKind, ItemRecord, Source } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { summariseFunds, type CoinCount, type FundsSummary, type LedgerLine } from "./funds-summary";
import { summariseItems, type ItemSummary } from "./item-groups";

export const FUNDS_VIEW = "dungeons-and-dinthla-funds";

const HOW_LINES_ARE_READ =
  "A $ line with an amount is coin; without one, it is an item. An amount is money out when it has a minus sign, or when “paid”, “spent”, “bought”, “gave” or “lost” comes before it with no comma between. A plus sign keeps it in.";

function coinText({ kind, count }: CoinCount): string {
  const written = Math.abs(count).toLocaleString("en");
  if (count < 0) return `−${written} ${kind}`;
  return `${written} ${kind}`;
}

function signedMoney(copper: number): string {
  if (copper <= 0) return formatMoney(copper);
  return `+${formatMoney(copper)}`;
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
  private ledger!: HTMLElement;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly actions: LinkActions,
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
    this.ledger = root.createEl("section", { cls: "dd-panel dd-ledger-panel" });
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
      if (group.holder === "") heading.setText("The party");
      else addNameLink(heading, group.holder, group.items[0]!.source.path, this.actions).setText(group.holder);
      const list = this.items.createEl("ul", { cls: "dd-list" });
      for (const item of group.items) this.addItemRow(list, item, ledger);
    }
    const folded = this.items.createEl("details", { cls: "dd-folded" });
    folded.createEl("summary", { text: "Gone" }).createSpan({ cls: "dd-count", text: String(summary.gone.length) });
    const gone = folded.createEl("ul", { cls: "dd-list" });
    if (summary.gone.length === 0) gone.createEl("li", { cls: "dd-empty", text: "Nothing sold, used or lost yet." });
    for (const item of summary.gone) this.addItemRow(gone, item, ledger);
  }

  private addItemRow(list: HTMLElement, item: ItemRecord, ledger: LedgerLine[]): void {
    const source = rowSourceOf(item);
    const row = addRowButton(list, source, this.actions);
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

  private renderLedger(lines: LedgerLine[]): void {
    this.ledger.empty();
    const title = this.ledger.createEl("h2", { cls: "dd-title", text: "Ledger" });
    title.createSpan({ cls: "dd-count", text: entriesText(lines.length) });
    const list = this.ledger.createEl("ul", { cls: "dd-ledger" });
    if (lines.length === 0) list.createEl("li", { cls: "dd-empty", text: "No coin entries yet." });
    for (const line of lines) this.addLedgerRow(list, line);
    this.ledger.createEl("p", { cls: "dd-note", text: HOW_LINES_ARE_READ });
  }

  private addLedgerRow(list: HTMLElement, { record, balance }: LedgerLine): void {
    const row = addRowButton(list, record.source, this.actions);
    row.addClass("dd-ledger-row");
    let direction = "In";
    if (record.entry.moneyOut) direction = "Out";
    row.createSpan({ cls: "dd-direction", text: direction });
    addLinkedText(row.createSpan({ cls: "dd-what" }), record.text, [], record.source.path, this.actions);
    row.createSpan({ cls: "dd-amount", text: signedMoney(record.entry.copper) });
    row.createSpan({ cls: "dd-balance", text: formatMoney(balance) });
  }
}
