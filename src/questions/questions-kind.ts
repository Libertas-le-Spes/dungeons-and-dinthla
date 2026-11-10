import type { QuestionRecord } from "../campaign/campaign";
import type { ListKind } from "../views/list-page";
import { listQuestions } from "./question-list";
import { addQuestionRow } from "./question-row";
import { questionShownKind } from "./question-shown-kind";

export const questionsKind: ListKind<QuestionRecord> = {
  ...questionShownKind.listWords,
  contentsOf: listQuestions,
  addRow: addQuestionRow,
};
