import type { App } from "obsidian";
import type { ItemRecord, Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { openSource } from "../views/open-view";
import type { CoinOutcome } from "./coin-modal";
import { openCoinEntry } from "./open-add-coin";

export type OpenLedgerEntry = (source: Source, onClosed: (outcome: CoinOutcome) => void) => void;

export interface LedgerOpeners {
  coinEntry: OpenLedgerEntry;
  item(name: string, source: Source, onClosed: (changed: boolean) => void): void;
}

function soldAt(items: ItemRecord[], source: Source): ItemRecord | undefined {
  return items.find((item) => item.gone !== null && item.gone.source.path === source.path && item.gone.source.line === source.line);
}

function outcomeOf(changed: boolean): CoinOutcome {
  if (changed) return "written";
  return "unchanged";
}

export function routeLedgerEntry(items: ItemRecord[], source: Source, openers: LedgerOpeners, onClosed: (outcome: CoinOutcome) => void): void {
  const sold = soldAt(items, source);
  if (sold === undefined) {
    openers.coinEntry(source, onClosed);
    return;
  }
  openers.item(sold.name, source, (changed) => onClosed(outcomeOf(changed)));
}

export function ledgerEntryOpener(app: App, store: CampaignStore, openItem: LedgerOpeners["item"]): OpenLedgerEntry {
  const openers: LedgerOpeners = {
    coinEntry: (source, onClosed) => openCoinEntry(app, store, source, () => void openSource(app, source), onClosed),
    item: openItem,
  };
  return (source, onClosed) => routeLedgerEntry(store.current.items, source, openers, onClosed);
}
