import { applySessionChange } from "../../campaign/changes/apply-session-change";
import { buildCampaign } from "../../campaign/reading/build-campaign";
import type { CoinRecord, ItemEvent, ItemRecord, SessionNote } from "../../campaign/record/campaign";
import { lineAsRead, removalAsRead, type Removal } from "../../campaign/writing/note-editor";
import { lineTakenOut, type Rewrite } from "../../campaign/changes/session-change";
import { sessionNumberOf } from "../../campaign/paths/session-file";
import { withoutBullet } from "../../notes/parts/bullet";
import { readAmount, type AmountReading } from "../../notes/writing/coin-lines";
import { readItemChange } from "../../notes/reading/item-change";
import { findLinks } from "../../notes/parts/link";
import { oneLine } from "../../notes/parts/one-line";
import { holderKeyOf } from "../../campaign/record/holder-key";
import { ExpectedHoldings, type HoldingState } from "./expected-holdings";
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
  howMany: string;
}

export interface ItemPlan {
  targetPath: string;
  added: string[];
  removal: Removal | null;
  rewrite: Rewrite | null;
  expected: readonly HoldingState[];
  purseCopper: number;
}

const WHOLE_COUNT = /^[1-9]\d*$/;

export function howManyWords(held: number): string {
  return `How many has to be a whole number from 1 to ${held}.`;
}

export const CHANGES_ANOTHER_ITEM =
  "That change wouldn't be read as asked, or would change another item or the purse beyond the sale, so nothing was written.";
export const GONE_LINE_SAYS_MORE = "The line that took it says more than the dialog writes, so change it in its note.";
export const CANT_SAY_WHOSE = "This item is held by more than one, and a line can name only a linked holder, so change it in its note.";
export const HOLDER_OF_GONE = "Set it to Held to give it to someone else: a new holder would bring it back.";

function isGoneStatus(kind: string): kind is "sold" | "used" | "lost" {
  return kind === "sold" || kind === "used" || kind === "lost";
}

export function statusOf(item: ItemRecord): ItemStatus {
  if (item.gone === null || !isGoneStatus(item.gone.kind)) return "held";
  return item.gone.kind;
}

export function asksHowMany(item: ItemRecord): boolean {
  if (statusOf(item) !== "held") return false;
  return item.held > 1;
}

function countAsked(item: ItemRecord, edit: ItemEdit): number | { error: string } {
  if (!asksHowMany(item)) return item.held;
  const typed = edit.howMany.trim();
  const count = Number(typed);
  if (!WHOLE_COUNT.test(typed) || count > item.held) return { error: howManyWords(item.held) };
  return count;
}

function countWords(count: number): string {
  if (count < 2) return "";
  return ` x${count}`;
}

function whoseWords(expected: ExpectedHoldings, holderText: string): string | { error: string } {
  if (!expected.needsName(holderText)) return "";
  const state = expected.stateOf(holderText);
  if (state === null || !state.holderLinked) return { error: CANT_SAY_WHOSE };
  return ` ${state.holderText}`;
}

function stateOf(item: ItemRecord): HoldingState {
  return { holderText: holderTextOf(item), holderLinked: item.holderLinked, status: statusOf(item), held: item.held };
}

function expectedOf(item: ItemRecord, sessions: SessionNote[]): ExpectedHoldings {
  const states: HoldingState[] = [];
  for (const candidate of buildCampaign(sessions).items) {
    if (candidate.name === item.name) states.push(stateOf(candidate));
  }
  return new ExpectedHoldings(states);
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
  return { holder: holderTextOf(item), status: statusOf(item), price: priceWritten(item, sessions), howMany: "1" };
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
    expected: expectedOf(item, sessions).all,
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
  const expected = expectedOf(item, sessions);
  const holderText = holderTextOf(item);
  const added: string[] = [];
  let removal: Removal | null = null;
  let purseCopper = 0;
  const gone = item.gone;
  if (statusChanged && gone !== null) {
    if (!writtenAsTheDialogWould(lineAsRead(sessions, gone.source))) return { error: GONE_LINE_SAYS_MORE };
    removal = removalAsRead(sessions, gone.source);
    purseCopper -= priceCopperOf(item, coins);
    expected.revive(holderText);
  }
  let keepsItsWritten = false;
  if (removal !== null && edit.status === "held") keepsItsWritten = writtenAfterRemoval(sessions, removal, item) !== item.written;
  let takenFrom = holderText;
  if (holderChanged || keepsItsWritten) {
    let given = item.held;
    if (!statusChanged) {
      const asked = countAsked(item, edit);
      if (typeof asked !== "number") return asked;
      given = asked;
    }
    const whose = whoseWords(expected, holderText);
    if (typeof whose !== "string") return whose;
    let moved = "";
    if (holderChanged) moved = countWords(given);
    added.push(`$$ ${item.written}${moved}${whose} :changed to ${edit.holder}`);
    if (holderChanged) expected.give(holderText, given, { holderText: edit.holder, holderLinked: findLinks(edit.holder).length > 0 });
    if (holderChanged) takenFrom = edit.holder;
  }
  if (statusChanged && edit.status !== "held") {
    const taken = countAsked(item, edit);
    if (typeof taken !== "number") return taken;
    const whose = whoseWords(expected, takenFrom);
    if (typeof whose !== "string") return whose;
    let line = `$$ ${item.written}${countWords(taken)}${whose} :${edit.status}`;
    const price = oneLine(edit.price);
    if (edit.status === "sold" && price !== "") {
      const reading = readAmount("in", price);
      if ("error" in reading) return { error: reading.error };
      line = `${line} ${reading.amount}`;
      purseCopper += reading.copper;
    }
    added.push(line);
    expected.take(takenFrom, taken, edit.status);
  }
  return { targetPath, added, removal, rewrite: null, expected: expected.all, purseCopper };
}

function heldWhileHeld(state: HoldingState): number | null {
  if (state.status !== "held") return null;
  return state.held;
}

function signature(item: ItemRecord, state: HoldingState): string {
  return JSON.stringify([item.name.toLowerCase(), item.written, holderKeyOf(state.holderText), state.holderLinked, state.status, heldWhileHeld(state)]);
}

function signatureOf(item: ItemRecord): string {
  return signature(item, stateOf(item));
}

export function refusalForItemPlan(sessions: SessionNote[], item: ItemRecord, plan: ItemPlan): string | null {
  const before = buildCampaign(sessions);
  const after = buildCampaign(applySessionChange(sessions, itemSessionChange(plan)).sessions);
  const wanted: string[] = [];
  for (const candidate of before.items) {
    if (candidate.name !== item.name) wanted.push(signatureOf(candidate));
  }
  for (const state of plan.expected) wanted.push(signature(item, state));
  const found = after.items.map(signatureOf);
  const itemsMatch = JSON.stringify(wanted.sort()) === JSON.stringify(found.sort());
  const purseMatches = after.purseCopper - before.purseCopper === plan.purseCopper;
  if (itemsMatch && purseMatches) return null;
  return CHANGES_ANOTHER_ITEM;
}
