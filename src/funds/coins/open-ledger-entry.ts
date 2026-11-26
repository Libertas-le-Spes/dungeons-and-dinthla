import type { ItemRecord, Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { CoinOutcome } from "./coin-dialog";
import { openCoinEntry, type CoinNotes } from "./open-add-coin";
import type { DialogShowing } from "../../views/dialogs/dialog-view";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

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

export function ledgerEntryOpener(
  showing: DialogShowing,
  notes: CoinNotes,
  store: CampaignStore,
  openItem: LedgerOpeners["item"],
  openNote: (source: Source) => void,
  syntax: PropertiesSyntax,
): OpenLedgerEntry {
  const openers: LedgerOpeners = {
    coinEntry: (source, onClosed) => openCoinEntry(showing, notes, store, source, () => openNote(source), onClosed, syntax),
    item: openItem,
  };
  return (source, onClosed) => routeLedgerEntry(store.current.items, source, openers, onClosed);
}
