import type { CampaignStore } from "../campaign/reading/campaign-store";
import type { RecordChange } from "../campaign/changes/record-change";
import { linesAddedTo } from "../campaign/changes/session-change";
import { verdictOf } from "../campaign/changes/verdict";
import { refusalForNewQuestion } from "./current-question";
import { planNewQuestion, type NewQuestionPlan } from "./new-question";
import type { NewQuestion } from "./new-question-modal";

export function newQuestion(store: Pick<CampaignStore, "current">, entry: NewQuestion, sessionPath: string): RecordChange<NewQuestionPlan> {
  return {
    plan: () => planNewQuestion(entry),
    checks: [(plan) => verdictOf(refusalForNewQuestion(store.current.questions, plan.text, plan.answer))],
    sessionChangeOf: (plan) => linesAddedTo(sessionPath, plan.lines),
  };
}
