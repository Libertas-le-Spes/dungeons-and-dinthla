import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, ItemRecord, SessionNote } from "../campaign/campaign";
import { lineAsRead, removalAsRead, type Removal } from "../campaign/note-editor";
import { sessionNoteOf, sessionNumberOf } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { readAmount } from "../notes/coin-lines";
import { readItemChange } from "../notes/item-change";
import { findLinks } from "../notes/link";
import { appendLines, removeLines } from "../notes/note-lines";
import { oneLine } from "../notes/question-lines";
import { holderNameOf, THE_PARTY, THE_PARTY_LABEL } from "./item-groups";

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

export function initialItemEdit(item: ItemRecord): ItemEdit {
  return { holder: holderTextOf(item), status: statusOf(item), soldFor: "" };
}

export function holderOptions(itemHolders: HolderOption[], characters: HolderOption[]): HolderOption[] {
  const options: HolderOption[] = [{ text: THE_PARTY, label: THE_PARTY_LABEL }];
  const seen = new Set([""]);
  const found = [...characters, ...itemHolders];
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
  const text = withoutBullet(read);
  const word = ` :${change.kind}`;
  const rest = text.slice(text.toLowerCase().lastIndexOf(word) + word.length);
  if (rest.trim() === "") return true;
  return change.kind === "sold" && /^\s/.test(rest) && !("error" in readAmount("in", rest));
}

function writtenAfterRemoval(sessions: SessionNote[], removal: Removal, item: ItemRecord): string | undefined {
  const after = buildCampaign(
    sessions.map((session) => {
      if (session.path !== removal.path) return session;
      return sessionNoteOf(session.path, session.number, removeLines(session.text, [removal]).text);
    }),
  );
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
  let keepsItsWritten = false;
  if (removal !== null && edit.status === "held") keepsItsWritten = writtenAfterRemoval(sessions, removal, item) !== item.written;
  let holderLinked = item.holderLinked;
  if (holderChanged || keepsItsWritten) {
    added.push(`$$ ${item.written} :changed to ${edit.holder}`);
    holderLinked = findLinks(edit.holder).length > 0;
  }
  if (statusChanged && edit.status !== "held") {
    let line = `$$ ${item.written} :${edit.status}`;
    const soldFor = oneLine(edit.soldFor);
    if (edit.status === "sold" && soldFor !== "") {
      const reading = readAmount("in", soldFor);
      if ("error" in reading) return { error: reading.error };
      line = `${line} ${reading.amount}`;
      purseCopper += reading.copper;
    }
    added.push(line);
  }
  return { targetPath, added, removal, holderName, holderLinked, status: edit.status, purseCopper };
}

function applyPlan(sessions: SessionNote[], plan: ItemPlan): SessionNote[] {
  return sessions.map((session) => {
    let text = session.text;
    if (plan.removal !== null && plan.removal.path === session.path) text = removeLines(text, [plan.removal]).text;
    if (session.path === plan.targetPath) text = appendLines(text, plan.added);
    return sessionNoteOf(session.path, session.number, text);
  });
}

function signature(item: ItemRecord, holderName: string, holderLinked: boolean, status: ItemStatus): string {
  return JSON.stringify([item.name.toLowerCase(), item.written, holderName.toLowerCase(), holderLinked, status]);
}

function signatureOf(item: ItemRecord): string {
  return signature(item, holderNameOf(item.holder), item.holderLinked, statusOf(item));
}

export function refusalForItemPlan(sessions: SessionNote[], item: ItemRecord, plan: ItemPlan): string | null {
  const before = buildCampaign(sessions);
  const after = buildCampaign(applyPlan(sessions, plan));
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
