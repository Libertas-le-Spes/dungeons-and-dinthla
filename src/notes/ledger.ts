import { partsBetweenCommas } from "./comma";
import { blankLinks, findLinks, removeFirstLink } from "./link";

export type CoinKind = "pp" | "gp" | "ep" | "sp" | "cp";

export interface CoinAmount {
  count: number;
  kind: CoinKind;
  moneyOut: boolean;
}

export interface CoinEntry {
  type: "coin";
  coins: CoinAmount[];
  copper: number;
  moneyOut: boolean;
}

export interface ItemEntry {
  type: "item";
  item: string;
  holder: string;
}

export type LedgerEntry = CoinEntry | ItemEntry;

const COPPER_PER: Record<CoinKind, number> = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
const AMOUNT = /(?<![^\s(])(?:([+\-−])\s*)?(\d[\d,]*)\s*(pp|gp|ep|sp|cp)\b/gi;
const MINUS_SIGNS = ["-", "−"];
const MONEY_OUT_WORD = /\b(paid|spent|bought|gave|lost)\b/i;

function moneyOutWordAt(part: string): number {
  return blankLinks(part).search(MONEY_OUT_WORD);
}

function isMoneyOut(sign: string | undefined, position: number, wordAt: number): boolean {
  if (sign !== undefined) return MINUS_SIGNS.includes(sign);
  if (wordAt === -1) return false;
  return position > wordAt;
}

function readAmount(match: RegExpMatchArray, wordAt: number): CoinAmount {
  const [, sign, digits, kind] = match;
  const count = Number.parseInt(digits!.replaceAll(",", ""), 10);
  const moneyOut = isMoneyOut(sign, match.index!, wordAt);
  return { count, kind: kind!.toLowerCase() as CoinKind, moneyOut };
}

function readAmountsIn(part: string): CoinAmount[] {
  const wordAt = moneyOutWordAt(part);
  return [...part.matchAll(AMOUNT)].map((match) => readAmount(match, wordAt));
}

export function copperOf({ count, kind, moneyOut }: CoinAmount): number {
  const worth = count * COPPER_PER[kind];
  if (moneyOut) return -worth;
  return worth;
}

function readCoins(coins: CoinAmount[]): CoinEntry {
  const copper = coins.reduce((sum, amount) => sum + copperOf(amount), 0);
  return { type: "coin", coins, copper, moneyOut: copper < 0 };
}

function readItem(body: string): ItemEntry | null {
  const [holder = ""] = findLinks(body);
  const item = removeFirstLink(body).replace(/\s+/g, " ").trim();
  if (item === "") return null;
  return { type: "item", item, holder };
}

export function readLedgerEntry(body: string): LedgerEntry | null {
  const amounts = partsBetweenCommas(body).flatMap(readAmountsIn);
  if (amounts.length > 0) return readCoins(amounts);
  return readItem(body);
}
