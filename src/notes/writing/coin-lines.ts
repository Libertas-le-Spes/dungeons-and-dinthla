import { AMOUNT, readLedgerEntry } from "../reading/ledger";
import { blankLinks } from "../parts/link";
import { formatMoney } from "../parts/money";
import { oneLine } from "../parts/one-line";

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
const LEADING_SIGN = /^([+\-−–—])\s*/;

export const NO_COIN = "Write the amount with its coin, like 35 gp or 4 sp, without commas between coins.";
export const NO_AMOUNT = "The amount comes to nothing; write what changed hands.";
export const SIGN_SAYS_OUT = "The amount has a minus sign, which says money out; choose Out.";
export const SIGN_SAYS_IN = "The amount has a plus sign, which says money in; choose In.";
export const NO_FOR = "Leave for: out of what it was for; a quest's reward is collected from the Quests view.";
export const HOLDER_NOT_LINKABLE = "Your character's note name can't be written as a link, so coin can't be written for them. Rename the note without [ ] | # or ^.";
export const HOLDER_CHANGES_IT = "Your character's note name would change how the line is read, so coin can't be written for them. Write the line in the session by hand.";
export const WORDS_CHANGE_IT = "The words would change how the line is read; reword what it was for.";

function bodyOf(direction: Direction, amount: string, what: string): string {
  let signed = amount;
  if (direction === "out") signed = `-${amount}`;
  return [signed, what].filter((part) => part !== "").join(" ");
}

function signRefusal(direction: Direction, typed: string): string | null {
  const sign = LEADING_SIGN.exec(typed);
  if (sign === null) return null;
  if (sign[1] === "+" && direction === "out") return SIGN_SAYS_IN;
  if (sign[1] !== "+" && direction === "in") return SIGN_SAYS_OUT;
  return null;
}

export function comparableLine(line: string): string {
  return line.replace(/(\d),(?=\d{3})/g, "$1").replace(/\s+/g, " ").trim().toLowerCase();
}

export type AmountReading = { amount: string; copper: number } | { error: string };

export function readAmount(direction: Direction, typedAmount: string): AmountReading {
  const typed = oneLine(typedAmount);
  const signed = signRefusal(direction, typed);
  if (signed !== null) return { error: signed };
  const amount = typed.replace(LEADING_SIGN, "");
  if (!AMOUNT_ONLY.test(amount)) return { error: NO_COIN };
  const worth = readLedgerEntry(amount);
  const typedAmounts = amount.match(ONE_AMOUNT)!.length;
  if (worth === null || worth.type !== "coin" || worth.coins.length !== typedAmounts) return { error: NO_COIN };
  if (worth.copper === 0) return { error: NO_AMOUNT };
  return { amount, copper: worth.copper };
}

interface ReadBody {
  body: string;
  copper: number;
}

type BodyReading = ReadBody | { error: string };

export interface CoinHolder {
  linktext: string;
  name: string;
}

const NOT_LINKABLE = /[[\]|#^\n\r]/;

function bodyReadingOf(draft: CoinDraft): BodyReading {
  const worth = readAmount(draft.direction, draft.amount);
  if ("error" in worth) return worth;
  const amount = worth.amount;
  const what = oneLine(draft.what);
  if (/\bfor:/i.test(blankLinks(what))) return { error: NO_FOR };
  let copper = worth.copper;
  if (draft.direction === "out") copper = -copper;
  const body = bodyOf(draft.direction, amount, what);
  if (!readsAsCoin(body, copper)) return { error: WORDS_CHANGE_IT };
  return { body, copper };
}

function readsAsCoin(body: string, copper: number): boolean {
  const read = readLedgerEntry(body);
  return read !== null && read.type === "coin" && read.copper === copper;
}

function moneyWordsOf(copper: number): string {
  let word = "In";
  if (copper < 0) word = "Out";
  return `${word} ${formatMoney(Math.abs(copper))}`;
}

export function readCoinDraft(draft: CoinDraft): CoinReading {
  const read = bodyReadingOf(draft);
  if ("error" in read) return read;
  const { body, copper } = read;
  return { line: `$ ${body}`, copper, reads: `Reads as ${moneyWordsOf(copper)}: ${body}` };
}

export function readHeldCoinDraft(draft: CoinDraft, holder: CoinHolder): CoinReading {
  if (NOT_LINKABLE.test(holder.linktext)) return { error: HOLDER_NOT_LINKABLE };
  const read = bodyReadingOf(draft);
  if ("error" in read) return read;
  const { body, copper } = read;
  const held = `[[${holder.linktext}]] ${body}`;
  if (!readsAsCoin(held, copper)) return { error: HOLDER_CHANGES_IT };
  return { line: `$ ${held}`, copper, reads: `Reads as ${moneyWordsOf(copper)} for ${holder.name}: ${body}` };
}

export function draftOf(text: string, copper: number, amounts: { count: number; kind: string }[]): CoinDraft {
  let direction: Direction = "in";
  if (copper < 0) direction = "out";
  const amount = amounts.map((coin) => `${coin.count.toLocaleString("en")} ${coin.kind}`).join(" ");
  const what = oneLine(text.replace(AMOUNT, " "));
  return { direction, amount, what };
}
