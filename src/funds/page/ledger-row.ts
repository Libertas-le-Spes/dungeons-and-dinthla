import { formatMoney } from "../../notes/parts/money";
import { addLinkedText, addRowButton, type LinkActions } from "../../views/lists/linked-text";
import type { LedgerLine } from "./funds-summary";

export const NO_COIN_ENTRIES = "No coin entries yet.";

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
