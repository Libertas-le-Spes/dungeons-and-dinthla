import type { Campaign, QuestionRecord } from "../campaign/campaign";
import { questionThreadKind } from "../campaign/question-thread-kind";
import type { ListContents } from "../views/list-page";
import { listThreads } from "../views/thread-list";

function noFacts(): string[] {
  return [];
}

export function listQuestions(campaign: Campaign, keywords: string[]): ListContents<QuestionRecord> {
  return listThreads({ kind: questionThreadKind, factsOf: noFacts }, campaign.questions, keywords);
}
