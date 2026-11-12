import type { QuestionRecord } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { RecordChange } from "../../campaign/changes/record-change";
import { notHidden } from "../../campaign/changes/hidden-refusal";
import { refusedWhen, verdictOf } from "../../campaign/changes/verdict";
import { ANSWER_GOES_ELSEWHERE, answerWouldGoElsewhere } from "./current-question";
import { planQuestionSave, planReopen, refusalForQuestionPlan, type QuestionEdit, type QuestionPlan } from "./question-plan";
import { questionSessionChange } from "./question-session-change";

type QuestionStore = Pick<CampaignStore, "current" | "sessionNotes">;

export function questionSave(store: QuestionStore, question: QuestionRecord, edit: QuestionEdit, sessionPath: string): RecordChange<QuestionPlan> {
  return {
    plan: () => planQuestionSave(question, edit, sessionPath),
    checks: [
      () => refusedWhen(answerWouldGoElsewhere(store.current.questions, question, edit.answer), ANSWER_GOES_ELSEWHERE),
      (plan) => verdictOf(refusalForQuestionPlan(store.sessionNotes, question, plan)),
      notHidden(() => store.sessionNotes, questionSessionChange),
    ],
    sessionChangeOf: questionSessionChange,
  };
}

export function questionReopen(store: QuestionStore, question: QuestionRecord, sessionPath: string): RecordChange<QuestionPlan> {
  return {
    plan: () => planReopen(question, sessionPath),
    checks: [(plan) => verdictOf(refusalForQuestionPlan(store.sessionNotes, question, plan))],
    sessionChangeOf: questionSessionChange,
  };
}
