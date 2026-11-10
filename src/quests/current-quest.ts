import type { QuestRecord } from "../campaign/campaign";
import { currentThread, placesOf } from "../campaign/current-thread";
import { keepsEveryPlace } from "../campaign/places";

export const SAME_TITLE = "An earlier active quest has the same title, so changes would go to it. Reword one of them first.";
export const GOES_ELSEWHERE = "What happened would be read as about another quest whose title starts the same way. Reword it.";

function outcomeOf(record: QuestRecord): string {
  if (record.closing === null) return "";
  return `${record.closing.status}:${record.closing.text}`;
}

function isSameQuest(current: QuestRecord, opened: QuestRecord): boolean {
  const sameSource = current.source.path === opened.source.path && current.source.line === opened.source.line;
  const stillInPlace = sameSource && keepsEveryPlace(placesOf(current), placesOf(opened));
  const sameFacts = current.reward === opened.reward && current.givenBy === opened.givenBy;
  return stillInPlace && sameFacts && current.text === opened.text && outcomeOf(current) === outcomeOf(opened);
}

export function currentQuest(quests: QuestRecord[], opened: QuestRecord): QuestRecord {
  return currentThread(quests, opened, isSameQuest);
}
