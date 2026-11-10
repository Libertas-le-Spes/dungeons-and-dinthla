import { applySessionChange } from "../campaign/apply-session-change";
import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, ItemEvent, ItemRecord, SessionNote } from "../campaign/campaign";
import { lineAsRead, removalAsRead, type Removal } from "../campaign/note-editor";
import { lineTakenOut, type Rewrite } from "../campaign/session-change";
import { sessionNumberOf } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { readAmount, type AmountReading } from "../notes/coin-lines";
import { readItemChange } from "../notes/item-change";
import { findLinks } from "../notes/link";
import { oneLine } from "../notes/one-line";
import { holderNameOf, THE_PARTY, THE_PARTY_LABEL } from "./item-groups";
import { itemSessionChange } from "./item-session-change";

export type ItemStatus = "held" | "sold" | "used" | "lost";

export interface HolderOption {
  text: string;
  label: string;
}

export interface ItemEdit {
  holder: string;
  status: ItemStatus;
  price: string;
}

export interface ItemPlan {
  targetPath: string;
  added: string[];
  removal: Removal | null;
  rewrite: Rewrite | null;
  holderName: string;
  holderLinked: boolean;
  status: ItemStatus;
  purseCopper: number;
}

export const CHANGES_ANOTHER_ITEM =
  "That change wouldn't be read as asked, or would change another item or the purse beyond the sale, so nothing was written.";
export const GONE_LINE_SAYS_MORE = "The line that took it says more than the dialog writes, so change it in its note.";
export const HOLDER_OF_GONE = "Set it to Held to give it to someone else: a new holder would bring it back.";

function isGoneStatus(kind: string): kind is "sold" | "used" | "lost" {
  return kind === "sold" || kind === "used" || kind === "lost";
}

export function statusOf(item: ItemRecord): ItemStatus {
  if (item.gone === null || !isGoneStatus(item.gone.kind)) return "held";
  return item.gone.kind;
}

export function holderTextOf(item: ItemRecord): string {
  if (holderNameOf(item.holder) === "") return THE_PARTY;
  if (!item.holderLinked) return item.holder;
  return `[[${item.holder}]]`;
}

export function holderOptionOf(item: ItemRecord): HolderOption {
  return { text: holderTextOf(item), label: holderNameOf(item.holder) };
}

function soldLineOf(item: ItemRecord): ItemEvent | null {
  if (item.gone === null || item.gone.kind !== "sold") return null;
  return item.gone;
}

function changeWordEnd(text: string, kind: string): number {
  const word = ` :${kind}`;
  return text.toLowerCase().lastIndexOf(word) + word.length;
}

function writtenAsTheDialogWould(read: string | undefined): read is string {
  if (read === undefined) return false;
  const change = readItemChange(read);
  if (change === null) return false;
  const text = withoutBullet(read);
  const rest = text.slice(changeWordEnd(text, change.kind));
  if (rest.trim() === "") return true;
  return change.kind === "sold" && /^\s/.test(rest) && !("error" in readAmount("in", rest));
}

function priceWritten(item: ItemRecord, sessions: SessionNote[]): string {
  const sold = soldLineOf(item);
  if (sold === null) return "";
  const read = lineAsRead(sessions, sold.source);
  if (!writtenAsTheDialogWould(read)) return "";
  const text = withoutBullet(read);
  return text.slice(changeWordEnd(text, "sold")).trim();
}

export function initialItemEdit(item: ItemRecord, sessions: SessionNote[]): ItemEdit {
  return { holder: holderTextOf(item), status: statusOf(item), price: priceWritten(item, sessions) };
}

export function holderOptions(itemHolders: HolderOption[], characters: HolderOption[]): HolderOption[] {
  const byName = new Map<string, HolderOption>();
  for (const option of [...itemHolders, ...characters]) {
    const key = holderNameOf(option.text).toLowerCase();
    if (key !== "") byName.set(key, option);
  }
  const found = [...byName.values()].sort((first, second) => first.label.localeCompare(second.label));
  return [{ text: THE_PARTY, label: THE_PARTY_LABEL }, ...found];
}

export function latestSessionOfItem(item: ItemRecord, campaignFolder: string): number {
  let latest = 0;
  for (const event of item.history) {
    const number = sessionNumberOf(event.source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}

function sameName(first: string, second: string): boolean {
  return holderNameOf(first).toLowerCase() === holderNameOf(second).toLowerCase();
}

function priceCopperOf(item: ItemRecord, coins: CoinRecord[]): number {
  const gone = item.gone;
  if (gone === null) return 0;
  const sale = coins.find((coin) => coin.source.path === gone.source.path && coin.source.line === gone.source.line);
  if (sale === undefined) return 0;
  return sale.entry.copper;
}

function withPrice(soldLine: string, price: string): string {
  const text = withoutBullet(soldLine);
  const sold = text.slice(0, changeWordEnd(text, "sold"));
  if (price === "") return sold;
  return `${sold} ${price}`;
}

function priceChange(item: ItemRecord, typed: string, sessions: SessionNote[], coins: CoinRecord[]): AmountReading | null {
  const price = oneLine(typed);
  if (price === priceWritten(item, sessions)) return null;
  let reading: AmountReading = { amount: "", copper: 0 };
  if (price !== "") reading = readAmount("in", price);
  if ("error" in reading || reading.copper !== priceCopperOf(item, coins)) return reading;
  return null;
}

function planPriceChange(
  item: ItemRecord,
  sold: ItemEvent,
  edit: ItemEdit,
  sessions: SessionNote[],
  coins: CoinRecord[],
  targetPath: string,
): ItemPlan | { error: string } | null {
  const price = priceChange(item, edit.price, sessions, coins);
  if (price === null) return null;
  if ("error" in price) return price;
  const read = lineAsRead(sessions, sold.source);
  if (!writtenAsTheDialogWould(read)) return { error: GONE_LINE_SAYS_MORE };
  return {
    targetPath,
    added: [],
    removal: null,
    rewrite: { old: removalAsRead(sessions, sold.source), line: withPrice(read, price.amount) },
    holderName: holderNameOf(item.holder),
    holderLinked: item.holderLinked,
    status: "sold",
    purseCopper: price.copper - priceCopperOf(item, coins),
  };
}

function writtenAfterRemoval(sessions: SessionNote[], removal: Removal, item: ItemRecord): string | undefined {
  const removed = applySessionChange(sessions, lineTakenOut(removal));
  const after = buildCampaign(removed.sessions);
  const found = after.items.find((candidate) => candidate.name === item.name);
  if (found === undefined) return undefined;
  return found.written;
}

export function planItemSave(
  item: ItemRecord,
  edit: ItemEdit,
  sessions: SessionNote[],
  coins: CoinRecord[],
  targetPath: string,
): ItemPlan | { error: string } {
  const statusChanged = edit.status !== statusOf(item);
  const holderChanged = !sameName(edit.holder, item.holder);
  if (holderChanged && edit.status !== "held" && !statusChanged) return { error: HOLDER_OF_GONE };
  const sold = soldLineOf(item);
  if (sold !== null && !statusChanged) {
    const priceChanged = planPriceChange(item, sold, edit, sessions, coins, targetPath);
    if (priceChanged !== null) return priceChanged;
  }
  let holderName = holderNameOf(item.holder);
  if (holderChanged) holderName = holderNameOf(edit.holder);
  const added: string[] = [];
  let removal: Removal | null = null;
  let purseCopper = 0;
  const gone = item.gone;
  if (statusChanged && gone !== null) {
    if (!writtenAsTheDialogWould(lineAsRead(sessions, gone.source))) return { error: GONE_LINE_SAYS_MORE };
    removal = removalAsRead(sessions, gone.source);
    purseCopper -= priceCopperOf(item, coins);
  }
  let keepsItsWritten = false;
  if (removal !== null && edit.status === "held") keepsItsWritten = writtenAfterRemoval(sessions, removal, item) !== item.written;
  let holderLinked = item.holderLinked;
  if (holderChanged || keepsItsWritten) {
    added.push(`$$ ${item.written} :changed to ${edit.holder}`);
    holderLinked = findLinks(edit.holder).length > 0;
  }
  if (statusChanged && edit.status !== "held") {
    let line = `$$ ${item.written} :${edit.status}`;
    const price = oneLine(edit.price);
    if (edit.status === "sold" && price !== "") {
      const reading = readAmount("in", price);
      if ("error" in reading) return { error: reading.error };
      line = `${line} ${reading.amount}`;
      purseCopper += reading.copper;
    }
    added.push(line);
  }
  return { targetPath, added, removal, rewrite: null, holderName, holderLinked, status: edit.status, purseCopper };
}

function signature(item: ItemRecord, holderName: string, holderLinked: boolean, status: ItemStatus): string {
  return JSON.stringify([item.name.toLowerCase(), item.written, holderName.toLowerCase(), holderLinked, status]);
}

function signatureOf(item: ItemRecord): string {
  return signature(item, holderNameOf(item.holder), item.holderLinked, statusOf(item));
}

export function refusalForItemPlan(sessions: SessionNote[], item: ItemRecord, plan: ItemPlan): string | null {
  const before = buildCampaign(sessions);
  const after = buildCampaign(applySessionChange(sessions, itemSessionChange(plan)).sessions);
  const wanted = before.items.map((candidate) => {
    if (candidate.name === item.name) return signature(item, plan.holderName, plan.holderLinked, plan.status);
    return signatureOf(candidate);
  });
  const found = after.items.map(signatureOf);
  const itemsMatch = JSON.stringify(wanted.sort()) === JSON.stringify(found.sort());
  const purseMatches = after.purseCopper - before.purseCopper === plan.purseCopper;
  if (itemsMatch && purseMatches) return null;
  return CHANGES_ANOTHER_ITEM;
}
