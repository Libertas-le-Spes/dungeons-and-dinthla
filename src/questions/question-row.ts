import type { QuestionRecord } from "../campaign/campaign";
import { sessionLabelOf } from "../campaign/session-file";
import { addLinkedText, addRowButton, type LinkActions } from "../views/linked-text";

function addMark(row: HTMLElement, question: QuestionRecord): void {
  if (question.answer === null) {
    row.createSpan({ cls: "dd-mark dd-mark-question", text: "?" });
    return;
  }
  row.createSpan({ cls: "dd-mark dd-mark-question", text: "✓", attr: { "aria-label": "Answered" } });
}

export function addQuestionRow(
  list: HTMLElement,
  question: QuestionRecord,
  keywords: string[],
  actions: LinkActions,
): void {
  const row = addRowButton(list, question.source, actions);
  addMark(row, question);
  const body = row.createSpan({ cls: "dd-body" });
  addLinkedText(body.createSpan({ cls: "dd-text" }), question.text, keywords, question.source.path, actions);
  if (question.answer !== null) {
    const answer = body.createSpan({ cls: "dd-answer" });
    addLinkedText(answer, question.answer.text, keywords, question.answer.source.path, actions);
  }
  body.createSpan({ cls: "dd-meta", text: sessionLabelOf(question.source.path) });
}
