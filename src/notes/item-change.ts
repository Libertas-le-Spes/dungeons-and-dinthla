import { readLedgerEntry, type CoinEntry } from "./ledger";
import { findLinks, unlink } from "./link";
import { withoutBullet } from "./bullet";

export type ItemChangeKind = "changed" | "sold" | "used" | "lost";

export interface ItemChange {
  text: string;
  item: string;
  kind: ItemChangeKind;
  holder?: string;
  sale?: CoinEntry;
}

const ITEM_CHANGE_MARKER = /^\$\$/;
const CHANGE_WORD = / :(changed to|sold|used|lost)\b/gi;

const KINDS: Record<string, ItemChangeKind> = {
  "changed to": "changed",
  sold: "sold",
  used: "used",
  lost: "lost",
};

function holderIn(rest: string): string {
  const [link] = findLinks(rest);
  if (link !== undefined) return link;
  return unlink(rest).trim();
}

function saleIn(rest: string): CoinEntry | undefined {
  const entry = readLedgerEntry(rest);
  if (entry?.type !== "coin") return undefined;
  return entry;
}

export function readItemChange(line: string): ItemChange | null {
  const text = withoutBullet(line);
  if (!ITEM_CHANGE_MARKER.test(text)) return null;
  const body = text.slice(2);
  const last = [...body.matchAll(CHANGE_WORD)].at(-1);
  if (last === undefined) return null;
  const item = body.slice(0, last.index).trim();
  if (item === "") return null;
  const kind = KINDS[last[1]!.toLowerCase()]!;
  const rest = body.slice(last.index + last[0].length);
  const change: ItemChange = { text: body.trim(), item, kind };
  if (kind === "changed") change.holder = holderIn(rest);
  if (kind === "sold") change.sale = saleIn(rest);
  return change;
}
