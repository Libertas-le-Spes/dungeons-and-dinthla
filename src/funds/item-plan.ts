import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, ItemRecord, SessionNote } from "../campaign/campaign";
import { lineAsRead, removalAsRead, type Removal } from "../campaign/note-editor";
import { sessionNoteOf, sessionNumberOf } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { comparableLine, readAmount } from "../notes/coin-lines";
import { readItemChange } from "../notes/item-change";
import { appendLines, removeLines } from "../notes/note-lines";
import { oneLine } from "../notes/question-lines";
import { holderNameOf, THE_PARTY } from "./item-groups";

export type ItemStatus = "held" | "sold" | "used" | "lost";

export interface HolderOption {
  text: string;
  label: string;
}

export interface ItemEdit {
  holder: string;
  status: ItemStatus;
  soldFor: string;
}

export interface ItemPlan {
  targetPath: string;
  added: string[];
  removal: Removal | null;
  holderName: string;
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

export function holderTextOf(holder: string): string {
  if (holderNameOf(holder) === "") return THE_PARTY;
  return `[[${holder}]]`;
}

export function initialItemEdit(item: ItemRecord): ItemEdit {
  return { holder: holderTextOf(item.holder), status: statusOf(item), soldFor: "" };
}

export function holderOptions(itemHolders: string[], characters: HolderOption[]): HolderOption[] {
  const options: HolderOption[] = [{ text: THE_PARTY, label: "The party" }];
  const seen = new Set([""]);
  const found = [...itemHolders.map((holder) => ({ text: holderTextOf(holder), label: holderNameOf(holder) })), ...characters];
  for (const option of found.sort((first, second) => first.label.localeCompare(second.label))) {
    const key = holderNameOf(option.text).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }
  return options;
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

function saleCopperOf(item: ItemRecord, coins: CoinRecord[]): number {
  const gone = item.gone;
  if (gone === null) return 0;
  const sale = coins.find((coin) => coin.source.path === gone.source.path && coin.source.line === gone.source.line);
  if (sale === undefined) return 0;
  return sale.entry.copper;
}

function writtenAsTheDialogWould(read: string | undefined): boolean {
  if (read === undefined) return false;
  const change = readItemChange(read);
  if (change === null) return false;
  const line = comparableLine(withoutBullet(read));
  const base = comparableLine(`$$ ${change.item} :${change.kind}`);
  if (!line.startsWith(base)) return false;
  const rest = line.slice(base.length);
  if (rest === "") return true;
  return change.kind === "sold" && rest.startsWith(" ") && !("error" in readAmount("in", rest));
}

export function planItemSave(
  item: ItemRecord,
  edit: ItemEdit,
  sessions: SessionNote[],
  coins: CoinRecord[],
  targetPath: string,
): ItemPlan | { error: string } {
  const was = statusOf(item);
  const statusChanged = edit.status !== was;
  const holderChanged = !sameName(edit.holder, item.holder);
  if (holderChanged && edit.status !== "held" && !statusChanged) return { error: HOLDER_OF_GONE };
  let holderName = holderNameOf(item.holder);
  if (holderChanged) holderName = holderNameOf(edit.holder);
  const added: string[] = [];
  let removal: Removal | null = null;
  let purseCopper = 0;
  if (statusChanged && was !== "held") {
    if (!writtenAsTheDialogWould(lineAsRead(sessions, item.gone!.source))) return { error: GONE_LINE_SAYS_MORE };
    removal = removalAsRead(sessions, item.gone!.source);
    purseCopper -= saleCopperOf(item, coins);
  }
  const keepsItsOnlyLine = removal !== null && item.history.length === 1 && edit.status === "held";
  if (holderChanged || keepsItsOnlyLine) added.push(`$$ ${item.written} :changed to ${edit.holder}`);
  if (statusChanged && edit.status !== "held") {
    let line = `$$ ${item.written} :${edit.status}`;
    const price = oneLine(edit.soldFor);
    if (edit.status === "sold" && price !== "") {
      const reading = readAmount("in", price);
      if ("error" in reading) return { error: reading.error };
      line = `${line} ${reading.amount}`;
      purseCopper += reading.copper;
    }
    added.push(line);
  }
  return { targetPath, added, removal, holderName, status: edit.status, purseCopper };
}

function applyPlan(sessions: SessionNote[], plan: ItemPlan): SessionNote[] {
  return sessions.map((session) => {
    let text = session.text;
    if (plan.removal !== null && plan.removal.path === session.path) text = removeLines(text, [plan.removal]).text;
    if (session.path === plan.targetPath) text = appendLines(text, plan.added);
    return sessionNoteOf(session.path, session.number, text);
  });
}

function signature(name: string, holderName: string, status: ItemStatus): string {
  return JSON.stringify([name.toLowerCase(), holderName.toLowerCase(), status]);
}

function signatureOf(item: ItemRecord): string {
  return signature(item.name, holderNameOf(item.holder), statusOf(item));
}

export function refusalForItemPlan(sessions: SessionNote[], item: ItemRecord, plan: ItemPlan): string | null {
  const before = buildCampaign(sessions);
  const after = buildCampaign(applyPlan(sessions, plan));
  const wanted = before.items.map((candidate) => {
    if (candidate.name === item.name) return signature(item.name, plan.holderName, plan.status);
    return signatureOf(candidate);
  });
  const found = after.items.map(signatureOf);
  const itemsMatch = JSON.stringify(wanted.sort()) === JSON.stringify(found.sort());
  const purseMatches = after.purseCopper - before.purseCopper === plan.purseCopper;
  if (itemsMatch && purseMatches) return null;
  return CHANGES_ANOTHER_ITEM;
}
