import type { Campaign, QuestRecord } from "../campaign/campaign";
import type { ListContents } from "../views/list-page";
import { listThreads } from "../views/thread-list";

function factsOf(record: QuestRecord): string[] {
  const facts: string[] = [];
  if (record.givenBy !== undefined) facts.push(record.givenBy);
  if (record.reward !== undefined) facts.push(record.reward);
  return facts;
}

export function listQuests(campaign: Campaign, keywords: string[]): ListContents<QuestRecord> {
  return listThreads(campaign.quests, keywords, factsOf);
}
