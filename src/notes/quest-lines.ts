import { questTrackedKind } from "../kinds/quest-tracked-kind";
import type { QuestStatus } from "../campaign/campaign";
import { readLedgerEntry } from "./ledger";
import { readMarker } from "./marker";
import { readQuest } from "./quest";
import { followUpLine, oneLine, openingAfterLine, openingTextOf } from "./thread-lines";

export function questTextOf(text: string): string {
  return openingTextOf(questTrackedKind.marker, text);
}

export function progressLine(title: string, text: string): string {
  return followUpLine("progress", title, text);
}

export function outcomeLine(status: QuestStatus, title: string, text: string): string {
  return followUpLine(status, title, text).trimEnd();
}

export function newQuestLine(title: string, givenBy: string, reward: string): string {
  const parts = [`${questTrackedKind.marker.symbol} ${title}`];
  if (givenBy !== "") parts.push(`from: ${givenBy}`);
  if (reward !== "") parts.push(`reward: ${reward}`);
  return parts.join(", ");
}

export function followUpQuestLine(followUp: string, title: string): string {
  return openingAfterLine(questTrackedKind.marker, followUp, title);
}

export function rewardLine(reward: string, title: string): string {
  return `$ +${oneLine(reward).replace(/^\+\s*/, "")} reward, for: ${title}`;
}

export function isCoinReward(reward: string): boolean {
  const entry = readLedgerEntry(reward);
  return entry !== null && entry.type === "coin" && !entry.moneyOut;
}

export function isQuestLine(written: string, title: string): boolean {
  const { marker, body } = readMarker(written);
  return marker === "quest" && readQuest(body).title === title;
}
