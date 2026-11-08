import { readLedgerEntry } from "./ledger";
import { formatMoney } from "./money";
import { oneLine } from "./question-lines";

export type Direction = "in" | "out";

export interface CoinDraft {
  direction: Direction;
  amount: string;
  what: string;
}

export type CoinReading = { line: string; copper: number; reads: string } | { error: string };

const AMOUNT_ONLY = /^(?:\d[\d,]*\s*(?:pp|gp|ep|sp|cp)\b\s*)+$/i;
export const NO_COIN = "Write the amount with its coin, like 35 gp or 4 sp.";
export const WORDS_CHANGE_IT = "The words would change how the line is read; reword what it was for.";

function amountOf(amount: string): string {
  return oneLine(amount).replace(/^[+\-−]\s*/, "");
}

function bodyOf(draft: CoinDraft, amount: string): string {
  const what = oneLine(draft.what);
  const parts = [amount];
  if (draft.direction === "out") parts.unshift("Paid");
  if (what !== "") parts.push(what);
  return parts.join(" ");
}

export function readCoinDraft(draft: CoinDraft): CoinReading {
  const amount = amountOf(draft.amount);
  if (!AMOUNT_ONLY.test(amount)) return { error: NO_COIN };
  const worth = readLedgerEntry(amount);
  if (worth === null || worth.type !== "coin") return { error: NO_COIN };
  let copper = worth.copper;
  if (draft.direction === "out") copper = -copper;
  const body = bodyOf(draft, amount);
  const read = readLedgerEntry(body);
  if (read === null || read.type !== "coin" || read.copper !== copper) return { error: WORDS_CHANGE_IT };
  let word = "In";
  if (copper < 0) word = "Out";
  return { line: `$ ${body}`, copper, reads: `Reads as ${word} ${formatMoney(Math.abs(copper))}: ${body}` };
}
