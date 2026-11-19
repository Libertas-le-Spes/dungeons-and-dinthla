import type { Campaign, ItemRecord } from "../../campaign/record/campaign";
import { summariseItems, type ItemSummary } from "./item-groups";
import { ownLinkOf } from "./own-link";

export interface WhoseItemsParts {
  campaign: Campaign;
  ownNames: readonly string[];
}

export interface WhoseItems {
  mine: ItemSummary;
  party: ItemSummary;
}


export function whoseItems({ campaign, ownNames }: WhoseItemsParts): WhoseItems {
  const mine: ItemRecord[] = [];
  const party: ItemRecord[] = [];
  for (const item of campaign.items) {
    const own = ownLinkOf({ links: [item.holder], ownNames });
    if (own === undefined) party.push(item);
    else mine.push({ ...item, holder: own });
  }
  return {
    mine: summariseItems({ ...campaign, items: mine }),
    party: summariseItems({ ...campaign, items: party }),
  };
}
