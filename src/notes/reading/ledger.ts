import { choiceOf } from "../../views/dialogs/choice-of";
import { withoutBlockId } from "../parts/block-id";
import { partsBetweenCommas } from "../parts/comma";
import { findLinks, removeFirstLink } from "../parts/link";
import { countedItemOf } from "../parts/item-count";

export type CoinKind = "pp" | "gp" | "ep" | "sp" | "cp";

const COIN_KINDS: CoinKind[] = ["pp", "gp", "ep", "sp", "cp"];

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
  count: number | null;
  holder: string;
  links: string[];
}

export type LedgerEntry = CoinEntry | ItemEntry;

const COPPER_PER: Record<CoinKind, number> = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };
export const AMOUNT = /(?<![^\s(])(?:([+\-−–—])\s*)?(\d[\d,]*)\s*(pp|gp|ep|sp|cp)\b/gi;
const MINUS_SIGNS = ["-", "−", "–", "—"];

function coinKindOf(written: string): CoinKind {
  const kind = choiceOf(COIN_KINDS, written.toLowerCase());
  if (kind === undefined) throw new Error(`${written} isn't a coin.`);
  return kind;
}

class PartReading {
  private moneyOut = false;

  amountOf(match: RegExpMatchArray): CoinAmount {
    const [, sign, digits, kind] = match;
    if (sign !== undefined) this.moneyOut = MINUS_SIGNS.includes(sign);
    const count = Number.parseInt(digits!.replaceAll(",", ""), 10);
    return { count, kind: coinKindOf(kind!), moneyOut: this.moneyOut };
  }
}

function readAmountsIn(part: string): CoinAmount[] {
  const reading = new PartReading();
  return [...part.matchAll(AMOUNT)].map((match) => reading.amountOf(match));
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

function readItem(written: string): ItemEntry | null {
  const body = withoutBlockId(written);
  const links = findLinks(body);
  const [holder = ""] = links;
  const counted = countedItemOf(removeFirstLink(body).replace(/\s+/g, " ").trim());
  if (counted.item === "") return null;
  return { type: "item", item: counted.item, count: counted.count, holder, links };
}

export function readLedgerEntry(body: string): LedgerEntry | null {
  const amounts = partsBetweenCommas(body).flatMap(readAmountsIn);
  if (amounts.length > 0) return readCoins(amounts);
  return readItem(body);
}
