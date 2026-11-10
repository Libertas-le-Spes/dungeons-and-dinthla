import type { QuestionRecord } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import type { RecordChange } from "../campaign/record-change";
import { refusedWhen, verdictOf } from "../campaign/verdict";
import { ANSWER_GOES_ELSEWHERE, answerWouldGoElsewhere } from "./current-question";
import { planQuestionSave, planReopen, refusalForQuestionPlan, type QuestionEdit, type QuestionPlan } from "./question-plan";
import type { QuestionWriter } from "./question-writer";

type QuestionStore = Pick<CampaignStore, "current" | "sessionNotes">;

export function questionSave(store: QuestionStore, question: QuestionRecord, edit: QuestionEdit, sessionPath: string, writer: QuestionWriter): RecordChange<QuestionPlan> {
  return {
    plan: () => planQuestionSave(question, edit, sessionPath),
    checks: [
      () => refusedWhen(answerWouldGoElsewhere(store.current.questions, question, edit.answer), ANSWER_GOES_ELSEWHERE),
      (plan) => verdictOf(refusalForQuestionPlan(store.sessionNotes, question, plan)),
    ],
    writePlan: (plan) => writer.apply(plan),
  };
}

export function questionReopen(store: QuestionStore, question: QuestionRecord, sessionPath: string, writer: QuestionWriter): RecordChange<QuestionPlan> {
  return {
    plan: () => planReopen(question, sessionPath),
    checks: [(plan) => verdictOf(refusalForQuestionPlan(store.sessionNotes, question, plan))],
    writePlan: (plan) => writer.apply(plan),
  };
}
