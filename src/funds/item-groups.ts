import type { Campaign, ItemRecord } from "../campaign/campaign";

export interface HolderGroup {
  holder: string;
  items: ItemRecord[];
}

export interface ItemSummary {
  groups: HolderGroup[];
  gone: ItemRecord[];
  heldCount: number;
}

function byHolderWithThePartyLast(first: HolderGroup, second: HolderGroup): number {
  if (first.holder === "" && second.holder !== "") return 1;
  if (second.holder === "" && first.holder !== "") return -1;
  return first.holder.localeCompare(second.holder);
}

export function summariseItems(campaign: Campaign): ItemSummary {
  const held = campaign.items.filter((item) => item.gone === null);
  const groups = new Map<string, ItemRecord[]>();
  for (const item of held) {
    const group = groups.get(item.holder);
    if (group === undefined) groups.set(item.holder, [item]);
    else group.push(item);
  }
  const holderGroups = [...groups].map(([holder, items]) => ({ holder, items })).sort(byHolderWithThePartyLast);
  const gone = campaign.items.filter((item) => item.gone !== null).reverse();
  return { groups: holderGroups, gone, heldCount: held.length };
}
