import type { QuestionRecord } from "../campaign/campaign";
import type { ListKind } from "../views/list-view";
import { listQuestions } from "./question-list";
import { addQuestionRow } from "./question-row";

export const questionsKind: ListKind<QuestionRecord> = {
  displayText: "Questions",
  icon: "circle-help",
  itemName: "question",
  openWord: "open",
  foldedWord: "answered",
  emptyHint: "No open questions. Start a note with ? to ask one.",
  contentsOf: listQuestions,
  addRow: addQuestionRow,
};
