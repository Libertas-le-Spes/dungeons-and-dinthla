import { applySessionChange } from "../../campaign/changes/apply-session-change";
import { linesAddedTo } from "../../campaign/changes/session-change";
import { buildCampaign } from "../../campaign/reading/build-campaign";
import type { Campaign, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { storedItemKeyOf } from "../../characters/imported/lists/item-key";
import { holderNameOf } from "../items/item-groups";
import { statusOf } from "../items/item-plan";
import type { TrackedItem } from "./tracked-item";

export const ALREADY_ON_FUNDS_PAGE = "That item is already held on the funds page, so nothing was written.";
export const NOT_READ_AS_THE_ITEM = "That line wouldn't be read as this one item, held by this character, so nothing was written.";

const HELD = "held";

interface KeySplit {
  readonly same: string[];
  readonly others: string[];
}

function signatureOf(item: ItemRecord): string {
  return JSON.stringify([storedItemKeyOf(item.name), item.written, holderNameOf(item.holder).toLowerCase(), item.holderLinked, statusOf(item)]);
}

function expectedSignatureOf(tracked: TrackedItem): string {
  return JSON.stringify([tracked.key, tracked.written, tracked.holderName.toLowerCase(), true, HELD]);
}

function splitByKey(campaign: Campaign, key: string): KeySplit {
  const split: KeySplit = { same: [], others: [] };
  for (const item of campaign.items) {
    if (storedItemKeyOf(item.name) === key) split.same.push(signatureOf(item));
    else split.others.push(signatureOf(item));
  }
  return split;
}

function isHeldOnThePage(campaign: Campaign, key: string): boolean {
  for (const item of campaign.items) {
    if (item.gone === null && storedItemKeyOf(item.name) === key) return true;
  }
  return false;
}

function sameSignatures(first: string[], second: string[]): boolean {
  return JSON.stringify([...first].sort()) === JSON.stringify([...second].sort());
}

function withoutOne(signatures: readonly string[], unwanted: string): string[] | null {
  const position = signatures.indexOf(unwanted);
  if (position === -1) return null;
  const left = [...signatures];
  left.splice(position, 1);
  return left;
}

function leftAsTheyWere(left: readonly string[], before: readonly string[]): boolean {
  let unmatched: string[] | null = [...before];
  for (const signature of left) {
    if (unmatched === null) return false;
    unmatched = withoutOne(unmatched, signature);
  }
  if (unmatched === null) return false;
  return unmatched.length <= 1;
}

function addsOnlyTheItem(before: KeySplit, after: KeySplit, tracked: TrackedItem): boolean {
  if (!sameSignatures(before.others, after.others)) return false;
  const left = withoutOne(after.same, expectedSignatureOf(tracked));
  if (left === null) return false;
  return leftAsTheyWere(left, before.same);
}

export function refusalForTracking(sessions: SessionNote[], tracked: TrackedItem, sessionPath: string): string | null {
  const before = buildCampaign(sessions);
  if (isHeldOnThePage(before, tracked.key)) return ALREADY_ON_FUNDS_PAGE;
  const after = buildCampaign(applySessionChange(sessions, linesAddedTo(sessionPath, [tracked.line])).sessions);
  if (!addsOnlyTheItem(splitByKey(before, tracked.key), splitByKey(after, tracked.key), tracked)) return NOT_READ_AS_THE_ITEM;
  return null;
}
