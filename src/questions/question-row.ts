import type { QuestionRecord } from "../campaign/campaign";
import type { LinkActions } from "../views/lists/linked-text";
import { addThreadRow } from "../views/threads/thread-row";
import { questionShownKind } from "./question-shown-kind";

export function addQuestionRow(list: HTMLElement, question: QuestionRecord, keywords: string[], actions: LinkActions): void {
  addThreadRow(questionShownKind, list, question, keywords, actions);
}
