import { findLinks, removeFirstLink } from "./link";

export type CoinKind = "pp" | "gp" | "ep" | "sp" | "cp";

export interface CoinAmount {
  count: number;
  kind: CoinKind;
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

interface SignedAmount {
  coins: CoinAmount;
  minus: boolean;
}

const COPPER_PER: Record<CoinKind, number> = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
const AMOUNT = /(?<![^\s(])(?:([+\-−])\s*)?(\d[\d,]*)\s*(pp|gp|ep|sp|cp)\b/gi;
const MINUS_SIGNS = ["-", "−"];
const MONEY_OUT_WORD = /\b(paid|spent|bought|gave|lost)\b/i;

function readAmount(match: RegExpMatchArray): SignedAmount {
  const [, sign, digits, kind] = match;
  const count = Number.parseInt(digits!.replaceAll(",", ""), 10);
  return {
    coins: { count, kind: kind!.toLowerCase() as CoinKind },
    minus: sign !== undefined && MINUS_SIGNS.includes(sign),
  };
}

function readCoins(body: string, amounts: SignedAmount[]): CoinEntry {
  const moneyOut = amounts.some((amount) => amount.minus) || MONEY_OUT_WORD.test(body);
  const total = amounts.reduce((sum, { coins }) => sum + coins.count * COPPER_PER[coins.kind], 0);
  let copper = total;
  if (moneyOut) copper = -total;
  return { type: "coin", coins: amounts.map((amount) => amount.coins), copper, moneyOut };
}

function readItem(body: string): ItemEntry | null {
  const [holder = ""] = findLinks(body);
  const item = removeFirstLink(body).replace(/\s+/g, " ").trim();
  if (item === "") return null;
  return { type: "item", item, holder };
}

export function readLedgerEntry(body: string): LedgerEntry | null {
  const amounts = [...body.matchAll(AMOUNT)].map(readAmount);
  if (amounts.length > 0) return readCoins(body, amounts);
  return readItem(body);
}
