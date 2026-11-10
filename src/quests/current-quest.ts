import type { QuestRecord, Source } from "../campaign/campaign";
import { keepsEveryPlace } from "../campaign/places";
import { CHANGED_IN_NOTE } from "../campaign/note-editor";
import { sessionNumberOf } from "../campaign/session-file";
import { findSubject } from "../campaign/subject";
import { oneLine } from "../notes/thread-lines";

export const SAME_TITLE = "An earlier active quest has the same title, so changes would go to it. Reword one of them first.";
export const GOES_ELSEWHERE = "What happened would be read as about another quest whose title starts the same way. Reword it.";

function outcomeOf(record: QuestRecord): string {
  if (record.outcome === null) return "";
  return `${record.outcome.status}:${record.outcome.text}`;
}

function placesOf(record: QuestRecord): Source[] {
  const sources = [record.source, ...record.progress.map((note) => note.source)];
  if (record.outcome !== null) sources.push(record.outcome.source);
  return sources;
}

function isSameQuest(current: QuestRecord, opened: QuestRecord): boolean {
  const sameSource = current.source.path === opened.source.path && current.source.line === opened.source.line;
  const stillInPlace = sameSource && keepsEveryPlace(placesOf(current), placesOf(opened));
  const sameFacts = current.quest.reward === opened.quest.reward && current.quest.givenBy === opened.quest.givenBy;
  return stillInPlace && sameFacts && current.quest.title === opened.quest.title && outcomeOf(current) === outcomeOf(opened);
}

export function currentQuest(quests: QuestRecord[], opened: QuestRecord): QuestRecord {
  const current = quests.find((record) => isSameQuest(record, opened));
  if (current === undefined) throw new Error(CHANGED_IN_NOTE);
  return current;
}

export function sharesTitleWithEarlierActiveQuest(quests: QuestRecord[], record: QuestRecord): boolean {
  const index = quests.indexOf(record);
  return quests.slice(0, index).some((earlier) => earlier.outcome === null && earlier.quest.title === record.quest.title);
}

export function latestSessionOfQuest(record: QuestRecord, campaignFolder: string): number {
  const sources = [record.source, ...record.progress.map((note) => note.source)];
  if (record.outcome !== null) sources.push(record.outcome.source);
  let latest = 0;
  for (const source of sources) {
    const number = sessionNumberOf(source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}

export function happenedWouldGoElsewhere(quests: QuestRecord[], record: QuestRecord, happened: string): boolean {
  const active = quests.filter((candidate) => candidate === record || candidate.outcome === null);
  const found = findSubject(`${record.quest.title}: ${oneLine(happened)}`, active, (candidate) => candidate.quest.title);
  return found !== null && found.candidate !== record;
}
