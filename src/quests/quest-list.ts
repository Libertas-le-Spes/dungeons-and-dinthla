import type { Campaign, QuestRecord } from "../campaign/record/campaign";
import type { ListContents } from "../views/lists/list-page";
import { listThreads } from "../views/threads/thread-list";
import { questShownKind } from "./quest-shown-kind";

export function listQuests(campaign: Campaign, keywords: string[]): ListContents<QuestRecord> {
  return listThreads(questShownKind, campaign, keywords);
}
