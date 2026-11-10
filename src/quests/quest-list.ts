import type { Campaign, QuestRecord } from "../campaign/campaign";
import { questThreadKind } from "../campaign/quest-thread-kind";
import type { ListContents } from "../views/list-page";
import { listThreads } from "../views/thread-list";

function factsOf(record: QuestRecord): string[] {
  const facts: string[] = [];
  if (record.quest.givenBy !== undefined) facts.push(record.quest.givenBy);
  if (record.quest.reward !== undefined) facts.push(record.quest.reward);
  return facts;
}

export function listQuests(campaign: Campaign, keywords: string[]): ListContents<QuestRecord> {
  return listThreads({ kind: questThreadKind, factsOf }, campaign.quests, keywords);
}
