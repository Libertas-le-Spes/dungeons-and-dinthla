import { AMOUNT, readLedgerEntry } from "./ledger";
import { blankLinks } from "./link";
import { formatMoney } from "./money";
import { oneLine } from "./question-lines";

export type Direction = "in" | "out";

export interface CoinDraft {
  direction: Direction;
  amount: string;
  what: string;
}

export interface CoinLine {
  line: string;
  copper: number;
  reads: string;
}

export type CoinReading = CoinLine | { error: string };

const ONE_AMOUNT = /(?:\d{1,3}(?:,\d{3})+|\d{1,9})\s*(?:pp|gp|ep|sp|cp)\b/gi;
const AMOUNT_ONLY = /^(?:(?:\d{1,3}(?:,\d{3})+|\d{1,9})\s*(?:pp|gp|ep|sp|cp)\b\s*)+$/i;
const LEADING_SIGN = /^([+\-−])\s*/;
const MONEY_OUT_WORD = /\b(paid|spent|bought|gave|lost)\b/i;
const LEADING_MONEY_OUT_WORD = /^(paid|spent|bought|gave|lost)\b\s*/i;

export const NO_COIN = "Write the amount with its coin, like 35 gp or 4 sp, without commas between coins.";
export const NO_AMOUNT = "The amount comes to nothing; write what changed hands.";
export const SIGN_SAYS_OUT = "The amount has a minus sign, which says money out; choose Out.";
export const SIGN_SAYS_IN = "The amount has a plus sign, which says money in; choose In.";
export const WORDS_SAY_OUT = "The words say money out; choose Out, or reword what it was for.";
export const NO_FOR = "Leave for: out of what it was for; a quest's reward is collected from the Quests view.";
export const WORDS_CHANGE_IT = "The words would change how the line is read; reword what it was for.";

function bodyOf(direction: Direction, amount: string, what: string): string {
  if (direction === "in") return [amount, what].filter((part) => part !== "").join(" ");
  const verb = LEADING_MONEY_OUT_WORD.exec(what);
  if (verb === null) return ["Paid", amount, what].filter((part) => part !== "").join(" ");
  const word = verb[1]!;
  const capitalised = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return [capitalised, amount, what.slice(verb[0].length)].filter((part) => part !== "").join(" ");
}

function signRefusal(direction: Direction, typed: string): string | null {
  const sign = LEADING_SIGN.exec(typed);
  if (sign === null) return null;
  if (sign[1] === "+" && direction === "out") return SIGN_SAYS_IN;
  if (sign[1] !== "+" && direction === "in") return SIGN_SAYS_OUT;
  return null;
}

export function readCoinDraft(draft: CoinDraft): CoinReading {
  const typed = oneLine(draft.amount);
  const signed = signRefusal(draft.direction, typed);
  if (signed !== null) return { error: signed };
  const amount = typed.replace(LEADING_SIGN, "");
  if (!AMOUNT_ONLY.test(amount)) return { error: NO_COIN };
  const worth = readLedgerEntry(amount);
  const typedAmounts = amount.match(ONE_AMOUNT)!.length;
  if (worth === null || worth.type !== "coin" || worth.coins.length !== typedAmounts) return { error: NO_COIN };
  if (worth.copper === 0) return { error: NO_AMOUNT };
  const what = oneLine(draft.what);
  if (/\bfor:/i.test(blankLinks(what))) return { error: NO_FOR };
  if (draft.direction === "in" && MONEY_OUT_WORD.test(blankLinks(what))) return { error: WORDS_SAY_OUT };
  let copper = worth.copper;
  if (draft.direction === "out") copper = -copper;
  const body = bodyOf(draft.direction, amount, what);
  const read = readLedgerEntry(body);
  if (read === null || read.type !== "coin" || read.copper !== copper) return { error: WORDS_CHANGE_IT };
  let word = "In";
  if (copper < 0) word = "Out";
  return { line: `$ ${body}`, copper, reads: `Reads as ${word} ${formatMoney(Math.abs(copper))}: ${body}` };
}

export function draftOf(text: string, copper: number, amounts: { count: number; kind: string }[]): CoinDraft {
  let direction: Direction = "in";
  if (copper < 0) direction = "out";
  const amount = amounts.map((coin) => `${coin.count.toLocaleString("en")} ${coin.kind}`).join(" ");
  const what = oneLine(text.replace(AMOUNT, " "));
  return { direction, amount, what };
}
