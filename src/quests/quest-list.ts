import type { Campaign, QuestRecord } from "../campaign/campaign";
import { unlink } from "../notes/link";
import type { ListContents } from "../views/list-view";

function searchableTextOf(record: QuestRecord): string {
  const texts = [record.quest.title];
  if (record.quest.givenBy !== undefined) texts.push(record.quest.givenBy);
  if (record.quest.reward !== undefined) texts.push(record.quest.reward);
  if (record.outcome !== null) texts.push(record.outcome.text);
  return unlink(texts.join(" ")).toLowerCase();
}

function matchesEvery(record: QuestRecord, keywords: string[]): boolean {
  const text = searchableTextOf(record);
  return keywords.every((keyword) => text.includes(keyword));
}

export function listQuests(campaign: Campaign, keywords: string[]): ListContents<QuestRecord> {
  const newestFirst = [...campaign.quests].reverse();
  const active = newestFirst.filter((record) => record.outcome === null);
  const finished = newestFirst.filter((record) => record.outcome !== null);
  return {
    open: active.filter((record) => matchesEvery(record, keywords)),
    folded: finished.filter((record) => matchesEvery(record, keywords)),
    openCount: active.length,
    foldedCount: finished.length,
  };
}
