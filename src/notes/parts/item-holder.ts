import { countedItemOf } from "./item-count";
import { findLinks } from "./link";

const TRAILING_LINK = /^(.*\S)\s+(\[\[[^[\]]+\]\])$/;

export interface NamedHolder {
  readonly item: string;
  readonly holder: string;
}

export interface HeldWords {
  readonly item: string;
  readonly count: number | null;
  readonly named: NamedHolder | null;
}

interface TrailingLink {
  readonly rest: string;
  readonly holder: string;
}

function trailingLinkOf(text: string): TrailingLink | null {
  const match = TRAILING_LINK.exec(text);
  if (match === null) return null;
  const [, rest, link] = match;
  if (rest === undefined || link === undefined) return null;
  const [holder] = findLinks(link);
  if (holder === undefined) return null;
  return { rest, holder };
}

export function heldWordsOf(written: string): HeldWords {
  const linkLast = trailingLinkOf(written);
  if (linkLast !== null) {
    const counted = countedItemOf(linkLast.rest);
    return { item: written, count: counted.count, named: { item: counted.item, holder: linkLast.holder } };
  }
  const counted = countedItemOf(written);
  const countLast = trailingLinkOf(counted.item);
  if (countLast === null) return { item: counted.item, count: counted.count, named: null };
  return { item: counted.item, count: counted.count, named: { item: countLast.rest, holder: countLast.holder } };
}
