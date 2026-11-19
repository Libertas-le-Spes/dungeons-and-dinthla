import { readLedgerEntry, type CoinEntry } from "./ledger";
import { findLinks, unlink } from "../parts/link";
import { withoutBlockId } from "../parts/block-id";
import { withoutBullet } from "../parts/bullet";
import { heldWordsOf, type NamedHolder } from "../parts/item-holder";

export type ItemChangeKind = "changed" | "sold" | "used" | "lost";

export interface ItemChange {
  text: string;
  item: string;
  count: number | null;
  named: NamedHolder | null;
  namedAfter: string[];
  kind: ItemChangeKind;
  holder?: string;
  holderLinked?: boolean;
  sale?: CoinEntry;
}

const ITEM_CHANGE_MARKER = /^\$\$/;
const CHANGE_WORD = / :(changed to|sold|used|lost)\b/gi;

const KINDS = new Map<string, ItemChangeKind>([
  ["changed to", "changed"],
  ["sold", "sold"],
  ["used", "used"],
  ["lost", "lost"],
]);

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
  const held = heldWordsOf(withoutBlockId(body.slice(0, last.index)).trim());
  if (held.item === "") return null;
  const kind = KINDS.get(last[1]!.toLowerCase())!;
  const rest = body.slice(last.index + last[0].length);
  const change: ItemChange = { text: body.trim(), item: held.item, count: held.count, named: held.named, namedAfter: [], kind };
  if (kind === "changed") {
    const found = holderIn(rest);
    change.holder = found.holder;
    change.holderLinked = found.holderLinked;
  }
  if (kind === "sold") change.sale = saleIn(rest);
  if (kind !== "changed") change.namedAfter = findLinks(rest);
  return change;
}
