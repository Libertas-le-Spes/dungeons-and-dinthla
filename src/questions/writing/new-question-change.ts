import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { notHidden } from "../../campaign/changes/hidden-refusal";
import type { RecordChange } from "../../campaign/changes/record-change";
import { linesAddedTo } from "../../campaign/changes/session-change";
import { verdictOf } from "../../campaign/changes/verdict";
import { refusalForNewQuestion } from "./current-question";
import { planNewQuestion, type NewQuestion, type NewQuestionPlan } from "./new-question";

export function newQuestion(store: Pick<CampaignStore, "current" | "sessionNotes">, entry: NewQuestion, sessionPath: string): RecordChange<NewQuestionPlan> {
  const addedLines = (plan: NewQuestionPlan) => linesAddedTo(sessionPath, plan.lines);
  return {
    plan: () => planNewQuestion(entry),
    checks: [(plan) => verdictOf(refusalForNewQuestion(store.current.questions, plan.text, plan.answer)), notHidden(() => store.sessionNotes, addedLines)],
    sessionChangeOf: addedLines,
  };
}
