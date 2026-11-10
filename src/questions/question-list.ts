import type { Campaign, QuestionRecord } from "../campaign/campaign";
import type { ListContents } from "../views/list-page";
import { listThreads } from "../views/thread-list";

function noFacts(): string[] {
  return [];
}

export function listQuestions(campaign: Campaign, keywords: string[]): ListContents<QuestionRecord> {
  return listThreads(campaign.questions, keywords, noFacts);
}
