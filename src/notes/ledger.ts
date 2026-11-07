export type CoinKind = "pp" | "gp" | "ep" | "sp" | "cp";

export interface Coins {
  count: number;
  kind: CoinKind;
}

export interface CoinEntry {
  type: "coin";
  coins: Coins[];
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
const AMOUNT = /(^|[\s(])([+\-−])?\s*(\d[\d,]*)\s*(pp|gp|ep|sp|cp)\b/gi;
const MONEY_OUT_WORD = /\b(paid|spent|bought|gave|lost)\b/i;
const FIRST_LINK = /\[\[([^\]]+)\]\]/;

export function readLedgerEntry(body: string): LedgerEntry {
  const amounts = [...body.matchAll(AMOUNT)].map(([, , sign, count = "0", kind = "cp"]) => ({
    coins: { count: Number.parseInt(count.replace(/,/g, ""), 10), kind: kind.toLowerCase() as CoinKind },
    minus: sign !== undefined && sign !== "+",
  }));

  if (amounts.length > 0) {
    const moneyOut = amounts.some((amount) => amount.minus) || MONEY_OUT_WORD.test(body);
    const total = amounts.reduce((sum, { coins }) => sum + coins.count * COPPER_PER[coins.kind], 0);
    return { type: "coin", coins: amounts.map((amount) => amount.coins), copper: moneyOut ? -total : total, moneyOut };
  }

  const holder = FIRST_LINK.exec(body)?.[1] ?? "";
  const item = body.replace(FIRST_LINK, "").replace(/\s+/g, " ").trim() || body;
  return { type: "item", item, holder };
}

export function formatMoney(copper: number): string {
  const amount = Math.abs(copper);
  const gold = Math.floor(amount / 100);
  const silver = Math.floor((amount % 100) / 10);
  const rest = amount % 10;
  const parts: string[] = [];
  if (gold) parts.push(`${gold.toLocaleString("en")} gp`);
  if (silver) parts.push(`${silver} sp`);
  if (rest) parts.push(`${rest} cp`);
  return (copper < 0 ? "−" : "") + (parts.join(" ") || "0 gp");
}
