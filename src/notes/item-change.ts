import { readLedgerEntry, type CoinEntry } from "./ledger";
import { findLinks, unlink } from "./link";
import { withoutBlockId } from "./block-id";
import { withoutBullet } from "./bullet";

export type ItemChangeKind = "changed" | "sold" | "used" | "lost";

export interface ItemChange {
  text: string;
  item: string;
  kind: ItemChangeKind;
  holder?: string;
  holderLinked?: boolean;
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

function holderIn(rest: string): { holder: string; holderLinked: boolean } {
  const [link] = findLinks(rest);
  if (link !== undefined) return { holder: link, holderLinked: true };
  return { holder: unlink(rest).trim(), holderLinked: false };
}

function saleIn(rest: string): CoinEntry | undefined {
  const entry = readLedgerEntry(rest);
  if (entry?.type !== "coin") return undefined;
  return entry;
}

export function readItemChange(line: string): ItemChange | null {
  const text = withoutBullet(line);
  if (!ITEM_CHANGE_MARKER.test(text)) return null;
  const body = withoutBlockId(text.slice(2));
  const last = [...body.matchAll(CHANGE_WORD)].at(-1);
  if (last === undefined) return null;
  const item = withoutBlockId(body.slice(0, last.index)).trim();
  if (item === "") return null;
  const kind = KINDS[last[1]!.toLowerCase()]!;
  const rest = body.slice(last.index + last[0].length);
  const change: ItemChange = { text: body.trim(), item, kind };
  if (kind === "changed") {
    const found = holderIn(rest);
    change.holder = found.holder;
    change.holderLinked = found.holderLinked;
  }
  if (kind === "sold") change.sale = saleIn(rest);
  return change;
}
