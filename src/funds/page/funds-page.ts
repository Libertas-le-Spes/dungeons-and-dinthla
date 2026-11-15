import { ITEM_ROWS } from "../../views/lists/row-keys";
import { Component } from "obsidian";
import { isItemNamed } from "../item-notes/item-of-note";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { addNameLink, addRowButton, type LinkActions } from "../../views/lists/linked-text";
import type { ItemEventKind, ItemRecord, Source } from "../../campaign/record/campaign";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import type { LedgerLine } from "./funds-summary";
import { THE_PARTY_LABEL, type ItemSummary } from "../items/item-groups";
import { NO_COIN_ENTRIES } from "./ledger-row";
import { LedgerBox, type LedgerBoxParts } from "./ledger-box";
import { PurseBox } from "./purse-box";
import { whoseFunds } from "./whose-funds";
import type { OpenLedgerEntry } from "../coins/open-ledger-entry";
import { makeScrollList } from "../../views/lists/scroll-list";
import { Tabs } from "../../views/tabs/tabs";
import { whoseItems } from "../items/whose-items";
import { RowFocus } from "../../views/lists/row-focus";
import { shownItemName } from "../../characters/imported/lists/shown-item-name";

const HOW_LINES_ARE_READ =
  "A $ line with an amount is coin. Without one, it is an item. Coin is money out when it has a minus sign, or when “paid”, “spent”, “bought”, “gave” or “lost” comes before the amount with no comma between. A plus sign keeps it in. A link to your character anywhere on the line puts it on your list, in the Mine tab.";

const MINE_PURSE_TITLE = "Your purse from the ledger";
const PARTY_PURSE_TITLE = "Purse";
const MINE = "Mine";
const PARTY = "Party";
const NO_OWN_CHARACTER = "You have not named your character in this campaign yet.";
const NO_OWN_ITEMS = "No items of yours yet. Put your character's link anywhere on a $ line with no amount, like “$ Flame Tongue longsword found by [[Mira]]”.";
const NO_OWN_COIN = "No coin of yours yet. Put your character's link anywhere on a $ line with an amount, like “$ 30 gp from the bandits, share to [[Mira]]”.";
const NO_COIN_YET = "No coin yet. Note it as “$ 20 gp from the bandits”. A link to your character on the line, like “$ 30 gp from the bandits, share to [[Mira]]”, puts it on your list.";
const NO_ITEMS = "No items held. A $ line with no amount adds one, like “$ Rope found at the old mill”.";

interface OwnEmpty {
  ownNames: readonly string[];
  text: string;
}

function whenOwn({ ownNames, text }: OwnEmpty): string {
  if (ownNames.length === 0) return NO_OWN_CHARACTER;
  return text;
}

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

export class FundsPage extends Component {
  private readonly tabs: Tabs;
  private readonly shownPanel: Component | null;
  private readonly pursePanel: Component | null;
  private readonly minePurse: PurseBox;
  private readonly partyPurse: PurseBox;
  private readonly mineItems: HTMLElement;
  private readonly partyItems: HTMLElement;
  private readonly mineLedger: LedgerBox;
  private readonly partyLedger: LedgerBox;
  private readonly rowFocus = new RowFocus();

  constructor(private readonly parts: FundsPageParts) {
    super();
    const root = parts.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-funds");
    this.shownPanel = this.shownPanelOf(root);
    this.tabs = new Tabs({ parent: root, label: "Funds", first: MINE, second: PARTY });
    this.pursePanel = this.pursePanelOf(this.tabs.firstPanel);
    this.minePurse = new PurseBox({ panel: this.tabs.firstPanel.createEl("section", { cls: "dd-panel dd-purse-panel" }), title: MINE_PURSE_TITLE });
    this.mineItems = this.tabs.firstPanel.createEl("section", { cls: "dd-panel dd-items-panel" });
    this.partyPurse = new PurseBox({ panel: this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-purse-panel" }), title: PARTY_PURSE_TITLE });
    this.partyItems = this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-items-panel" });
    this.mineLedger = this.ledgerBoxOf({ panel: this.tabs.firstPanel.createEl("section", { cls: "dd-panel dd-ledger-panel" }), addCoin: null, label: "Your ledger entries" });
    this.partyLedger = this.ledgerBoxOf({ panel: this.tabs.secondPanel.createEl("section", { cls: "dd-panel dd-ledger-panel" }), addCoin: parts.addCoin, label: "Party ledger entries" });
    this.tabs.secondPanel.createEl("p", { cls: "dd-note", text: HOW_LINES_ARE_READ });
  }

  override onload(): void {
    if (this.shownPanel !== null) this.addChild(this.shownPanel);
    this.addChild(this.tabs);
    this.addChild(this.mineLedger);
    this.addChild(this.partyLedger);
    if (this.pursePanel !== null) this.addChild(this.pursePanel);
    this.register(this.parts.store.subscribe(() => this.render()));
    this.register(this.parts.ownCharacters.subscribe(() => this.render()));
    this.render();
  }

  private ledgerBoxOf({ panel, addCoin, label }: Pick<LedgerBoxParts, "panel" | "addCoin" | "label">): LedgerBox {
    const { actions, openLedgerEntry } = this.parts;
    return new LedgerBox({ panel, actions, openLedgerEntry, addCoin, label, rowFocus: this.rowFocus });
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
    const campaign = this.parts.store.current;
    const ownNames = this.parts.ownCharacters.names();
    const funds = whoseFunds({ campaign, ownNames });
    const items = whoseItems({ campaign, ownNames });
    const ledger = [...funds.mine.ledger, ...funds.party.ledger];
    this.minePurse.render({ summary: funds.mine, empty: whenOwn({ ownNames, text: NO_OWN_COIN }) });
    this.partyPurse.render({ summary: funds.party, empty: NO_COIN_YET });
    this.renderItems({ panel: this.mineItems, summary: items.mine, ledger, empty: whenOwn({ ownNames, text: NO_OWN_ITEMS }), label: "Items that are yours" });
    this.renderItems({ panel: this.partyItems, summary: items.party, ledger, empty: NO_ITEMS, label: "Items of the party" });
    this.mineLedger.render({ lines: funds.mine.ledger, empty: whenOwn({ ownNames, text: NO_OWN_COIN }) });
    this.partyLedger.render({ lines: funds.party.ledger, empty: NO_COIN_ENTRIES });
    this.rowFocus.afterRender();
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

}
