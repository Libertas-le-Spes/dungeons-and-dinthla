import { applySessionChange } from "../../campaign/changes/apply-session-change";
import { linesAddedTo } from "../../campaign/changes/session-change";
import { buildCampaign } from "../../campaign/reading/build-campaign";
import type { Campaign, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { itemKeyOf } from "../../characters/imported/lists/item-key";
import { holderNameOf } from "../items/item-groups";
import { statusOf } from "../items/item-plan";
import type { TrackedItem } from "./tracked-item";

export const ALREADY_ON_FUNDS_PAGE = "That item is already on the funds page, so nothing was written.";
export const NOT_READ_AS_THE_ITEM = "That line wouldn't be read as this one item, held by this character, so nothing was written.";

function signatureOf(item: ItemRecord): string {
  return JSON.stringify([item.name.toLowerCase(), item.written, holderNameOf(item.holder).toLowerCase(), item.holderLinked, statusOf(item)]);
}

function isTheItem(item: ItemRecord, tracked: TrackedItem): boolean {
  return itemKeyOf(item.name) === tracked.key;
}

function itemOf(campaign: Campaign, tracked: TrackedItem): ItemRecord | null {
  for (const item of campaign.items) {
    if (isTheItem(item, tracked)) return item;
  }
  return null;
}

function signaturesWithout(campaign: Campaign, tracked: TrackedItem): string[] {
  const signatures: string[] = [];
  for (const item of campaign.items) {
    if (isTheItem(item, tracked) === false) signatures.push(signatureOf(item));
  }
  return signatures.sort();
}

function isHeldBy(item: ItemRecord, tracked: TrackedItem): boolean {
  if (item.gone !== null || item.holderLinked === false) return false;
  return holderNameOf(item.holder).toLowerCase() === tracked.holderName.toLowerCase();
}

function sameOtherwise(before: Campaign, after: Campaign, tracked: TrackedItem): boolean {
  if (after.purseCopper !== before.purseCopper || after.coins.length !== before.coins.length) return false;
  return JSON.stringify(signaturesWithout(before, tracked)) === JSON.stringify(signaturesWithout(after, tracked));
}

export function refusalForTracking(sessions: SessionNote[], tracked: TrackedItem, sessionPath: string): string | null {
  const before = buildCampaign(sessions);
  if (itemOf(before, tracked) !== null) return ALREADY_ON_FUNDS_PAGE;
  const changed = applySessionChange(sessions, linesAddedTo(sessionPath, [tracked.line]));
  if (changed.linesAsRead === false) return NOT_READ_AS_THE_ITEM;
  const after = buildCampaign(changed.sessions);
  const added = itemOf(after, tracked);
  if (added === null || isHeldBy(added, tracked) === false) return NOT_READ_AS_THE_ITEM;
  if (sameOtherwise(before, after, tracked) === false) return NOT_READ_AS_THE_ITEM;
  return null;
}
