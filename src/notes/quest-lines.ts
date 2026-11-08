import { readLedgerEntry } from "./ledger";
import { readMarker } from "./marker";
import { readQuest } from "./quest";
import { oneLine } from "./question-lines";

type FinishedStatus = "completed" | "failed";

const OUTCOME_MARKERS: Record<FinishedStatus, string> = { completed: "!=", failed: "!x" };

export function questTextOf(text: string): string {
  return oneLine(text).replace(/^!\s*/, "");
}

export function progressLine(title: string, text: string): string {
  return `!+ ${title}: ${oneLine(text)}`;
}

export function outcomeLine(status: FinishedStatus, title: string, text: string): string {
  return `${OUTCOME_MARKERS[status]} ${title}: ${oneLine(text)}`.trimEnd();
}

export function newQuestLine(title: string, givenBy: string, reward: string): string {
  const parts = [`! ${title}`];
  if (givenBy !== "") parts.push(`from: ${givenBy}`);
  if (reward !== "") parts.push(`reward: ${reward}`);
  return parts.join(", ");
}

export function followUpQuestLine(followUp: string, title: string): string {
  return `! ${questTextOf(followUp)}, after: ${title}`;
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
