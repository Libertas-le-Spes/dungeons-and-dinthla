import type { Campaign, QuestionRecord } from "../campaign/campaign";
import type { ListContents } from "../views/lists/list-page";
import { listThreads } from "../views/threads/thread-list";
import { questionShownKind } from "./question-shown-kind";

export function listQuestions(campaign: Campaign, keywords: string[]): ListContents<QuestionRecord> {
  return listThreads(questionShownKind, campaign, keywords);
}
