import { ITEM_ROWS } from "../../views/lists/row-keys";
import { Component } from "obsidian";
import { isItemNamed } from "../item-notes/item-of-note";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { formatMoney } from "../../notes/parts/money";
import { addNameLink, addRowButton, type LinkActions } from "../../views/lists/linked-text";
import type { ItemEventKind, ItemRecord, Source } from "../../campaign/record/campaign";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { summariseFunds, type CoinCount, type FundsSummary, type LedgerLine } from "./funds-summary";
import { summariseItems, THE_PARTY_LABEL, type ItemSummary } from "../items/item-groups";
import type { CoinOutcome } from "../coins/coin-modal";
import { addLedgerRow, NO_COIN_ENTRIES } from "./ledger-row";
import type { OpenLedgerEntry } from "../coins/open-ledger-entry";
import { makeScrollList } from "../../views/lists/scroll-list";
import { Tabs } from "../../views/tabs/tabs";
import { whoseItems } from "../items/whose-items";
import { focusRowAt, NO_ROW, RowFocus } from "../../views/lists/row-focus";
import { shownItemName } from "../../characters/imported/lists/shown-item-name";

const HOW_LINES_ARE_READ =
  "A $ line with an amount is coin; without one, it is an item. An amount is money out when it has a minus sign, or when “paid”, “spent”, “bought”, “gave” or “lost” comes before it with no comma between. A plus sign keeps it in.";

function coinText({ kind, count }: CoinCount): string {
  const written = Math.abs(count).toLocaleString("en");
  if (count < 0) return `−${written} ${kind}`;
  return `${written} ${kind}`;
}

const MINE = "Mine";
const PARTY = "Party";
const NO_OWN_CHARACTER = "No character of yours is named in this campaign yet.";
const NO_OWN_ITEMS = "None of your items yet. A $ line without an amount, with your character's link first, like “$ [[Mira]] Flame Tongue longsword”, adds one.";

function noOwnItemsText(ownNames: readonly string[]): string {
  if (ownNames.length === 0) return NO_OWN_CHARACTER;
  return NO_OWN_ITEMS;
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

export interface ShownItem {
  name: string;
  panel(panelEl: HTMLElement): Component;
}

export type FundsStore = Pick<CampaignStore, "current" | "subscribe">;

export interface PursesBeside {
  panel(panelEl: HTMLElement): Component;
}

export interface OwnCharactersBeside {
  names(): string[];
  subscribe(changed: () => void): () => void;
}

export interface FundsPageParts {
  contentEl: HTMLElement;
  store: FundsStore;
  actions: LinkActions;
  noteExists: (name: string, sourcePath: string) => boolean;
  addCoin: ((returnFocus: () => void) => void) | null;
  openLedgerEntry: OpenLedgerEntry | null;
  openItem: ((name: string, source: Source, onClosed: (changed: boolean) => void) => void) | null;
  shownItem: ShownItem | null;
  pursesBeside: PursesBeside | null;
  ownCharacters: OwnCharactersBeside;
}

interface ItemsPanelParts {
  panel: HTMLElement;
  summary: ItemSummary;
  ledger: LedgerLine[];
  empty: string;
  label: string;
}

function rowNamed({ panel, name }: { panel: HTMLElement; name: string }): HTMLElement | undefined {
  const rows = Array.from(panel.querySelectorAll<HTMLElement>(".dd-row"));
  return rows.find((candidate) => ITEM_ROWS.keyOf(candidate) === name);
}

interface LedgerBox {
  count: HTMLElement;
  list: HTMLElement;
  addButton: HTMLElement | null;
}

export class FundsPage extends Component {
  private readonly tabs: Tabs;
  private readonly shownPanel: Component | null;
  private readonly pursePanel: Component | null;
  private readonly purse: HTMLElement;
  private readonly mineItems: HTMLElement;
  private readonly partyItems: HTMLElement;
  private readonly ledgerCount: HTMLElement;
  private readonly ledgerList: HTMLElement;
  private readonly addCoinButton: HTMLElement | null;
  private readonly rowFocus = new RowFocus();

  constructor(private readonly parts: FundsPageParts) {
    super();
    const root = parts.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-funds");
    this.shownPanel = this.shownPanelOf(root);
    this.tabs = new Tabs({ parent: root, label: "Funds", first: MINE, second: PARTY });
    this.pursePanel = this.pursePanelOf(this.tabs.firstPanel);
    this.mineItems = this.tabs.firstPanel.createEl("section", { cls: "dd-panel dd-items-panel" });
    this.purse = this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-purse-panel" });
    this.partyItems = this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-items-panel" });
    const ledger = this.buildLedger(this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-ledger-panel" }));
    this.ledgerCount = ledger.count;
    this.ledgerList = ledger.list;
    this.addCoinButton = ledger.addButton;
  }

  override onload(): void {
    if (this.shownPanel !== null) this.addChild(this.shownPanel);
    this.addChild(this.tabs);
    if (this.pursePanel !== null) this.addChild(this.pursePanel);
    this.register(this.parts.store.subscribe(() => this.render()));
    this.register(this.parts.ownCharacters.subscribe(() => this.render()));
    this.render();
  }

  private shownPanelOf(root: HTMLElement): Component | null {
    if (this.parts.shownItem === null) return null;
    return this.parts.shownItem.panel(root.createEl("section", { cls: "dd-panel dd-shown-item" }));
  }

  private pursePanelOf(panel: HTMLElement): Component | null {
    if (this.parts.pursesBeside === null) return null;
    return this.parts.pursesBeside.panel(panel.createEl("section", { cls: "dd-panel dd-own-purse-panel" }));
  }

  private isShown(item: ItemRecord): boolean {
    if (this.parts.shownItem === null) return false;
    return isItemNamed(item, this.parts.shownItem.name);
  }

  private markShown(row: HTMLElement, item: ItemRecord): void {
    if (!this.isShown(item)) return;
    row.addClass("dd-row-shown");
    row.setAttribute("aria-current", "true");
    const folded = row.closest("details");
    if (folded !== null) folded.open = true;
  }

  private render(): void {
    const summary = summariseFunds(this.parts.store.current);
    this.renderPurse(summary);
    const ownNames = this.parts.ownCharacters.names();
    const items = whoseItems({ summary: summariseItems(this.parts.store.current), ownNames });
    this.renderItems({ panel: this.mineItems, summary: items.mine, ledger: summary.ledger, empty: noOwnItemsText(ownNames), label: "Items that are yours" });
    this.renderItems({ panel: this.partyItems, summary: items.party, ledger: summary.ledger, empty: NO_ITEMS, label: "Items of the party" });
    this.renderLedger(summary.ledger);
    this.rowFocus.afterRender();
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

  private renderItems({ panel, summary, ledger, empty, label }: ItemsPanelParts): void {
    panel.empty();
    const title = panel.createEl("h2", { cls: "dd-title", text: "Items" });
    title.createSpan({ cls: "dd-count", text: heldText(summary.heldCount) });
    const box = panel.createDiv({ attr: { role: "group" } });
    makeScrollList({ element: box, label });
    if (summary.groups.length === 0) box.createEl("p", { cls: "dd-empty", text: empty });
    for (const group of summary.groups) {
      const heading = box.createEl("h3", { cls: "dd-holder" });
      if (group.holder === "") heading.setText(THE_PARTY_LABEL);
      else if (this.parts.noteExists(group.holder, group.sourcePath)) addNameLink(heading, group.holder, group.holder, group.sourcePath, this.parts.actions);
      else heading.setText(group.holder);
      const list = box.createEl("ul", { cls: "dd-list" });
      for (const item of group.items) this.addItemRow(list, item, ledger);
    }
    const folded = box.createEl("details", { cls: "dd-folded" });
    folded.createEl("summary", { text: "Gone" }).createSpan({ cls: "dd-count", text: String(summary.gone.length) });
    const gone = folded.createEl("ul", { cls: "dd-list" });
    if (summary.gone.length === 0) gone.createEl("li", { cls: "dd-empty", text: "Nothing sold, used or lost yet." });
    for (const item of summary.gone) this.addItemRow(gone, item, ledger);
  }

  private focusItemRow(name: string): boolean {
    const tabs = [
      { tab: MINE, panel: this.mineItems },
      { tab: PARTY, panel: this.partyItems },
    ];
    for (const { tab, panel } of tabs) {
      const row = rowNamed({ panel, name });
      if (row === undefined) continue;
      this.tabs.select(tab);
      const folded = row.closest("details");
      if (folded !== null) folded.open = true;
      row.focus();
      return true;
    }
    return false;
  }

  private afterItem(name: string, changed: boolean): void {
    this.rowFocus.afterClose(() => this.focusItemRow(name), changed, () => {});
  }

  private addItemRow(list: HTMLElement, item: ItemRecord, ledger: LedgerLine[]): void {
    const source = rowSourceOf(item);
    let actions = this.parts.actions;
    const openItem = this.parts.openItem;
    if (openItem !== null) {
      actions = { ...this.parts.actions, openRow: () => openItem(item.name, source, (changed) => this.afterItem(item.name, changed)) };
    }
    const row = addRowButton(list, source, actions);
    row.setAttr("data-item", item.name);
    ITEM_ROWS.mark(row, item.name);
    this.markShown(row, item);
    const goneWord = goneWordOf(item);
    if (goneWord === null) row.createSpan({ cls: "dd-mark dd-mark-ledger", text: "$" });
    else row.createSpan({ cls: "dd-mark dd-mark-gone", text: "✕", attr: { "aria-label": goneWord } });
    const body = row.createSpan({ cls: "dd-body" });
    const name = body.createSpan({ cls: "dd-text", text: shownItemName(item.name) });
    const meta = body.createSpan({ cls: "dd-meta" });
    if (goneWord !== null) {
      name.addClass("dd-gone");
      meta.appendText(goneWord);
      if (isSaleLogged(item, ledger)) meta.appendText(" · sale in the ledger");
      meta.appendText(" · ");
    }
    meta.appendText(sessionLabelOf(source.path));
  }

  private buildLedger(panel: HTMLElement): LedgerBox {
    const head = panel.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Ledger" });
    const count = title.createSpan({ cls: "dd-count" });
    const addCoin = this.parts.addCoin;
    let addButton: HTMLElement | null = null;
    if (addCoin !== null) {
      const button = head.createEl("button", { cls: "dd-create", text: "Add coin" });
      this.registerDomEvent(button, "click", () => addCoin(() => button.focus()));
      addButton = button;
    }
    const list = panel.createEl("ul", { cls: "dd-ledger" });
    makeScrollList({ element: list, label: "Ledger entries" });
    panel.createEl("p", { cls: "dd-note", text: HOW_LINES_ARE_READ });
    return { count, list, addButton };
  }

  private renderLedger(lines: LedgerLine[]): void {
    this.ledgerCount.setText(entriesText(lines.length));
    this.ledgerList.empty();
    if (lines.length === 0) this.ledgerList.createEl("li", { cls: "dd-empty", text: NO_COIN_ENTRIES });
    for (const line of lines) this.addLedgerRow(this.ledgerList, line);
  }

  private focusAddCoin(): void {
    if (this.addCoinButton !== null) this.addCoinButton.focus();
  }

  private afterEntry(source: Source, outcome: CoinOutcome): void {
    let focusRow = () => focusRowAt(this.ledgerList, source);
    if (outcome === "deleted") focusRow = NO_ROW;
    this.rowFocus.afterClose(focusRow, outcome !== "unchanged", () => this.focusAddCoin());
  }

  private addLedgerRow(list: HTMLElement, line: LedgerLine): void {
    let actions = this.parts.actions;
    const openLedgerEntry = this.parts.openLedgerEntry;
    if (openLedgerEntry !== null) {
      actions = { ...this.parts.actions, openRow: (source: Source) => openLedgerEntry(source, (outcome) => this.afterEntry(source, outcome)) };
    }
    addLedgerRow(list, line, actions, this.parts.actions);
  }
}
