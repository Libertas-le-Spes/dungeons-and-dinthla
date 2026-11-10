import type { CampaignStore } from "../campaign/campaign-store";
import type { RecordChange } from "../campaign/record-change";
import { verdictOf } from "../campaign/verdict";
import { questionTextOf } from "../notes/question-lines";
import { refusalForNewQuestion } from "./current-question";
import type { NewQuestion } from "./new-question-modal";
import type { QuestionWriter } from "./question-writer";

export function newQuestionAdd(store: Pick<CampaignStore, "current">, entry: NewQuestion, sessionPath: string, writer: QuestionWriter): RecordChange<NewQuestion> {
  return {
    plan: () => ({ question: questionTextOf(entry.question), answer: entry.answer }),
    checks: [(plan) => verdictOf(refusalForNewQuestion(store.current.questions, plan.question, plan.answer))],
    writePlan: (plan) => writer.add(plan.question, plan.answer, sessionPath),
  };
}
