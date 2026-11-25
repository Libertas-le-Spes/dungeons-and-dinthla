import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ItemRecord } from "../../campaign/record/campaign";
import type { LedgerLine } from "./funds-summary";
import { ItemsBox } from "./items-box";
import { LedgerBox, type AddCoinHere } from "./ledger-box";
import { PurseBox } from "./purse-box";
import { rowSourceOf } from "./rows/item-row";
import { whoseFunds, type WhoseFundsParts } from "./whose-funds";
import type { OwnSheet } from "../purses/own-characters";
import { minePurseOf } from "../purses/mine-purse";
import { PendingWork } from "../../views/pending/pending-work";
import type { OpenLedgerEntry } from "../coins/open-ledger-entry";
import type { OpenItem } from "../item-notes/item-panel";
import { whoseItems } from "../items/whose-items";
import { RowFocus } from "../../views/lists/row-focus";
import { MineSide, PARTY_SIDE, type CoinSide } from "../coins/coin-sides";
import type { NoteRef } from "../../host/notes/note-ref";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { TabList } from "../../views/components/layout/tab-list";
import type { ViewElement } from "../../views/elements/view-element";
import type { PagePart } from "../../views/pages/page-part";
import type { PageView, ShownPage } from "../../views/pages/page-view";

const PURSE_TITLE = "Purse";
const MINE = "Mine";
const PARTY = "Party";
const NO_OWN_CHARACTER = "No character of yours yet.";
const NO_COIN = "No coin yet. Try “$ 20 gp”.";
const NO_ITEMS = "No items yet. Try “$ Rope”.";
export const NO_COIN_ENTRIES = "No coin entries yet.";
const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-funds"];

interface OwnEmpty {
  ownNames: readonly string[];
  text: string;
}

function whenOwn({ ownNames, text }: OwnEmpty): string {
  if (ownNames.length === 0) return NO_OWN_CHARACTER;
  return text;
}

function stayPut(): void {}

export interface ShownItem {
  name: string;
  panel: PagePart;
}

export type AddCoinOn = (side: CoinSide, returnFocus: () => void) => void;

class SideAddCoin {
  constructor(
    private readonly addCoin: AddCoinOn,
    private readonly side: CoinSide,
  ) {}

  open(returnFocus: () => void): void {
    this.addCoin(this.side, returnFocus);
  }
}

function addCoinOn(addCoin: AddCoinOn | null, side: CoinSide): AddCoinHere | null {
  if (addCoin === null) return null;
  const adding = new SideAddCoin(addCoin, side);
  return adding.open.bind(adding);
}

export type FundsStore = Pick<CampaignStore, "current" | "subscribe">;

export interface OwnCharactersBeside {
  names(): string[];
  inPlay(): NoteRef | null;
  sheets(): Promise<OwnSheet[]>;
  subscribe(changed: () => void): () => void;
}

export interface FundsPageParts {
  store: FundsStore;
  opener: LinkOpener;
  noteExists: (name: string, sourcePath: string) => boolean;
  addCoin: AddCoinOn | null;
  openLedgerEntry: OpenLedgerEntry;
  openItem: OpenItem;
  shownItem: ShownItem | null;
  ownCharacters: OwnCharactersBeside;
}

interface FundsSide {
  tab: string;
  purse: PurseBox;
  items: ItemsBox;
  ledger: LedgerBox;
}

function sideTrees({ purse, items, ledger }: FundsSide): ViewElement[] {
  return [purse.tree(), items.tree(), ledger.tree()];
}

export class FundsPage implements ShownPage {
  readonly cls = PAGE_CLASSES;
  private readonly tabs = new TabList("Funds", [MINE, PARTY]);
  private readonly rowFocus = new RowFocus();
  private readonly reading = new PendingWork();
  private readonly mine: FundsSide;
  private readonly party: FundsSide;
  private readonly stops: (() => void)[] = [];
  private sheets: OwnSheet[] | null = null;
  private reads = 0;

  constructor(private readonly parts: FundsPageParts) {
    const owners = parts.ownCharacters;
    this.mine = this.sideOf(MINE, "Items that are yours", addCoinOn(parts.addCoin, new MineSide(owners.inPlay.bind(owners))), "Your ledger entries");
    this.party = this.sideOf(PARTY, "Items of the party", addCoinOn(parts.addCoin, PARTY_SIDE), "Party ledger entries");
  }

  opened(view: PageView): void {
    const shownItem = this.parts.shownItem;
    const trees: ViewElement[] = [];
    if (shownItem !== null) trees.push(shownItem.panel.tree());
    trees.push(...this.tabs.build([sideTrees(this.mine), sideTrees(this.party)]));
    view.show(trees);
    this.tabs.selectAt(0, false);
    if (shownItem !== null) shownItem.panel.started();
    this.stops.push(this.parts.store.subscribe(this.render.bind(this)));
    this.stops.push(this.parts.ownCharacters.subscribe(this.ownCharactersChanged.bind(this)));
    this.render();
    this.readSheets();
  }

  closed(): void {
    this.reads += 1;
    if (this.parts.shownItem !== null) this.parts.shownItem.panel.stopped();
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  rendered(): Promise<void> {
    return this.reading.settled();
  }

  private sideOf(tab: string, itemsLabel: string, addCoin: AddCoinHere | null, ledgerLabel: string): FundsSide {
    const { opener, noteExists, openLedgerEntry, shownItem } = this.parts;
    let shownName: string | null = null;
    if (shownItem !== null) shownName = shownItem.name;
    return {
      tab,
      purse: new PurseBox(PURSE_TITLE),
      items: new ItemsBox({ opener, noteExists, openItem: this.openItem.bind(this), shownName, label: itemsLabel }),
      ledger: new LedgerBox({ opener, openLedgerEntry, addCoin, label: ledgerLabel, rowFocus: this.rowFocus }),
    };
  }

  private ownCharactersChanged(): void {
    this.render();
    this.readSheets();
  }

  private readSheets(): void {
    this.reading.add(this.readSheetsNow());
  }

  private async readSheetsNow(): Promise<void> {
    this.reads += 1;
    const read = this.reads;
    const sheets = await this.parts.ownCharacters.sheets();
    if (read !== this.reads) return;
    this.sheets = sheets;
    this.render();
  }

  private render(): void {
    const campaign = this.parts.store.current;
    const ownNames = this.parts.ownCharacters.names();
    const funds = whoseFunds({ campaign, ownNames });
    const items = whoseItems({ campaign, ownNames });
    const ledger: LedgerLine[] = [...funds.mine.ledger, ...funds.party.ledger];
    this.renderMinePurse({ campaign, ownNames });
    this.party.purse.render({ summary: funds.party, empty: NO_COIN });
    this.mine.items.render({ summary: items.mine, ledger, empty: whenOwn({ ownNames, text: NO_ITEMS }) });
    this.party.items.render({ summary: items.party, ledger, empty: NO_ITEMS });
    this.mine.ledger.render({ lines: funds.mine.ledger, empty: whenOwn({ ownNames, text: NO_COIN }) });
    this.party.ledger.render({ lines: funds.party.ledger, empty: NO_COIN_ENTRIES });
    this.rowFocus.afterRender();
  }

  private renderMinePurse({ campaign, ownNames }: Pick<WhoseFundsParts, "campaign" | "ownNames">): void {
    if (this.sheets === null) return;
    this.mine.purse.render({ summary: minePurseOf({ campaign, sheets: this.sheets }), empty: whenOwn({ ownNames, text: NO_COIN }) });
  }

  private openItem(item: ItemRecord): void {
    this.parts.openItem(item.name, rowSourceOf(item), this.afterItem.bind(this, item.name));
  }

  private afterItem(name: string, changed: boolean): void {
    this.rowFocus.afterClose(this.focusItemRow.bind(this, name), changed, stayPut);
  }

  private focusItemRow(name: string): boolean {
    for (const side of [this.mine, this.party]) {
      if (!side.items.holds(name)) continue;
      this.tabs.select(side.tab);
      side.items.focus(name);
      return true;
    }
    return false;
  }
}
