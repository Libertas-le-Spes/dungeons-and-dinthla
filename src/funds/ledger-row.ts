import type { ItemRecord, Source } from "../campaign/campaign";
import { formatMoney } from "../notes/money";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";
import type { CoinOutcome } from "./coin-modal";
import type { LedgerLine } from "./funds-summary";

export const NO_COIN_ENTRIES = "No coin entries yet.";

export interface LedgerOpeners {
  coinEntry(source: Source, onClosed: (outcome: CoinOutcome) => void): void;
  item(name: string, source: Source, onClosed: (changed: boolean) => void): void;
}

function signedMoney(copper: number): string {
  if (copper <= 0) return formatMoney(copper);
  return `+${formatMoney(copper)}`;
}

export function addLedgerRow(list: HTMLElement, { record, balance }: LedgerLine, rowActions: LinkActions, linkActions: LinkActions): void {
  const row = addRowButton(list, record.source, rowActions);
  row.addClass("dd-ledger-row");
  let direction = "In";
  if (record.entry.moneyOut) direction = "Out";
  row.createSpan({ cls: "dd-direction", text: direction });
  addLinkedText(row.createSpan({ cls: "dd-what" }), record.text, [], record.source.path, linkActions);
  row.createSpan({ cls: "dd-amount", text: signedMoney(record.entry.copper) });
  row.createSpan({ cls: "dd-balance", text: formatMoney(balance) });
}

function soldAt(items: ItemRecord[], source: Source): ItemRecord | undefined {
  return items.find((item) => item.gone !== null && item.gone.source.path === source.path && item.gone.source.line === source.line);
}

function outcomeOf(changed: boolean): CoinOutcome {
  if (changed) return "written";
  return "unchanged";
}

export function openLedgerEntry(items: ItemRecord[], source: Source, openers: LedgerOpeners, onClosed: (outcome: CoinOutcome) => void): void {
  const sold = soldAt(items, source);
  if (sold === undefined) {
    openers.coinEntry(source, onClosed);
    return;
  }
  openers.item(sold.name, source, (changed) => onClosed(outcomeOf(changed)));
}
