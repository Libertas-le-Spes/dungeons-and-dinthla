import type { Campaign, ItemRecord, Source } from "../campaign/campaign";
import { unlink } from "../notes/link";

export interface HolderGroup {
  holder: string;
  items: ItemRecord[];
}

export interface ItemSummary {
  groups: HolderGroup[];
  gone: ItemRecord[];
  heldCount: number;
}

const THE_PARTY = "the party";
const SESSION_NUMBER = /Session (\d+)\.md$/;

function holderNameOf(holder: string): string {
  const name = unlink(holder).trim();
  if (name.toLowerCase() === THE_PARTY) return "";
  return name.slice(name.lastIndexOf("/") + 1).replace(/\.md$/i, "");
}

function byHolderWithThePartyLast(first: HolderGroup, second: HolderGroup): number {
  if (first.holder === "" && second.holder !== "") return 1;
  if (second.holder === "" && first.holder !== "") return -1;
  return first.holder.localeCompare(second.holder);
}

function sessionNumberIn(source: Source): number {
  const match = SESSION_NUMBER.exec(source.path);
  if (match === null) return 0;
  return Number.parseInt(match[1]!, 10);
}

function wentLater(first: ItemRecord, second: ItemRecord): number {
  const [a, b] = [first.gone!.source, second.gone!.source];
  const bySession = sessionNumberIn(b) - sessionNumberIn(a);
  if (bySession !== 0) return bySession;
  return b.line - a.line;
}

export function summariseItems(campaign: Campaign): ItemSummary {
  const held = campaign.items.filter((item) => item.gone === null);
  const groups = new Map<string, HolderGroup>();
  for (const item of held) {
    const name = holderNameOf(item.holder);
    const key = name.toLowerCase();
    const group = groups.get(key);
    if (group === undefined) groups.set(key, { holder: name, items: [item] });
    else group.items.push(item);
  }
  const holderGroups = [...groups.values()].sort(byHolderWithThePartyLast);
  const gone = campaign.items.filter((item) => item.gone !== null).sort(wentLater);
  return { groups: holderGroups, gone, heldCount: held.length };
}
