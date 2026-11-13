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

const HELD = "held";

function signatureOf(item: ItemRecord): string {
  return JSON.stringify([itemKeyOf(item.name), item.written, holderNameOf(item.holder).toLowerCase(), item.holderLinked, statusOf(item)]);
}

function expectedSignatureOf(tracked: TrackedItem): string {
  return JSON.stringify([tracked.key, tracked.written, tracked.holderName.toLowerCase(), true, HELD]);
}

function signaturesOf(campaign: Campaign): string[] {
  const signatures: string[] = [];
  for (const item of campaign.items) signatures.push(signatureOf(item));
  return signatures;
}

function isOnThePage(campaign: Campaign, tracked: TrackedItem): boolean {
  for (const item of campaign.items) {
    if (itemKeyOf(item.name) === tracked.key) return true;
  }
  return false;
}

export function refusalForTracking(sessions: SessionNote[], tracked: TrackedItem, sessionPath: string): string | null {
  const before = buildCampaign(sessions);
  if (isOnThePage(before, tracked)) return ALREADY_ON_FUNDS_PAGE;
  const after = buildCampaign(applySessionChange(sessions, linesAddedTo(sessionPath, [tracked.line])).sessions);
  const wanted = [...signaturesOf(before), expectedSignatureOf(tracked)].sort();
  if (JSON.stringify(wanted) !== JSON.stringify(signaturesOf(after).sort())) return NOT_READ_AS_THE_ITEM;
  return null;
}
