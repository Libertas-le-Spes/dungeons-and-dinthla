import type { Campaign, QuestRecord } from "../campaign/campaign";
import type { ListContents } from "../views/list-page";
import { listThreads } from "../views/thread-list";
import { questShownKind } from "./quest-shown-kind";

export function listQuests(campaign: Campaign, keywords: string[]): ListContents<QuestRecord> {
  return listThreads(questShownKind, campaign, keywords);
}
