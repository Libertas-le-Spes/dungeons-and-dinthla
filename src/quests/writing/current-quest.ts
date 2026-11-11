import type { QuestRecord } from "../../campaign/record/campaign";
import { currentThread } from "../../campaign/threads/current-thread";
import { keepsEveryPlace } from "../../campaign/record/places";
import { questThreadKind } from "../../campaign/threads/quest-thread-kind";
import { latestSessionOf, placesOf } from "../../campaign/threads/thread-places";
import { followUpWouldGoElsewhere, sharesTextWithEarlierOpenThread } from "../../campaign/threads/thread-text-checks";

export const SAME_TITLE = "An earlier active quest has the same title, so changes would go to it. Reword one of them first.";
export const GOES_ELSEWHERE = "What happened would be read as about another quest whose title starts the same way. Reword it.";

function outcomeOf(record: QuestRecord): string {
  if (record.outcome === null) return "";
  return `${record.outcome.status}:${record.outcome.text}`;
}

function isSameQuest(current: QuestRecord, opened: QuestRecord): boolean {
  const sameSource = current.source.path === opened.source.path && current.source.line === opened.source.line;
  const stillInPlace = sameSource && keepsEveryPlace(placesOf(questThreadKind, current), placesOf(questThreadKind, opened));
  const sameFacts = current.quest.reward === opened.quest.reward && current.quest.givenBy === opened.quest.givenBy;
  return stillInPlace && sameFacts && current.quest.title === opened.quest.title && outcomeOf(current) === outcomeOf(opened);
}

export function currentQuest(quests: QuestRecord[], opened: QuestRecord): QuestRecord {
  return currentThread(quests, opened, isSameQuest);
}

export function sharesTitleWithEarlierActiveQuest(quests: QuestRecord[], record: QuestRecord): boolean {
  return sharesTextWithEarlierOpenThread(questThreadKind, quests, record);
}

export function latestSessionOfQuest(record: QuestRecord, campaignFolder: string): number {
  return latestSessionOf(questThreadKind, record, campaignFolder);
}

export function happenedWouldGoElsewhere(quests: QuestRecord[], record: QuestRecord, happened: string): boolean {
  return followUpWouldGoElsewhere(questThreadKind, quests, record, happened);
}
