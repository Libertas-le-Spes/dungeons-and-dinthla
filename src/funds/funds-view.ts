import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { formatMoney } from "../notes/money";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";
import { summariseFunds, type CoinCount, type FundsSummary, type LedgerLine } from "./funds-summary";

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

function entriesText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 entry";
  return `${count} entries`;
}

export class FundsView extends ItemView {
  private purse!: HTMLElement;
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
    root.addClass("dd-tokens", "dd-root", "dd-funds");
    this.purse = root.createEl("section", { cls: "dd-panel" });
    this.ledger = root.createEl("section", { cls: "dd-panel" });
    this.register(this.store.subscribe(() => this.render()));
    this.render();
  }

  private render(): void {
    const summary = summariseFunds(this.store.current);
    this.renderPurse(summary);
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
