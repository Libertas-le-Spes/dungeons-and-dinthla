import type { QuestionRecord } from "../campaign/campaign";
import { sessionNumberOf } from "../campaign/session-file";
import { CHANGED_IN_NOTE } from "./question-writer";

function answerTextOf(question: QuestionRecord): string | null {
  if (question.answer === null) return null;
  return question.answer.text;
}

function isSameQuestion(current: QuestionRecord, opened: QuestionRecord): boolean {
  const sameSource = current.source.path === opened.source.path && current.source.line === opened.source.line;
  return sameSource && current.text === opened.text && answerTextOf(current) === answerTextOf(opened);
}

export function currentQuestion(questions: QuestionRecord[], opened: QuestionRecord): QuestionRecord {
  const current = questions.find((question) => isSameQuestion(question, opened));
  if (current === undefined) throw new Error(CHANGED_IN_NOTE);
  return current;
}

export function sharesTextWithEarlierOpenQuestion(questions: QuestionRecord[], question: QuestionRecord): boolean {
  const index = questions.indexOf(question);
  return questions.slice(0, index).some((earlier) => earlier.answer === null && earlier.text === question.text);
}

export function sessionOfQuestion(question: QuestionRecord, campaignFolder: string): number {
  const asked = sessionNumberOf(question.source.path, campaignFolder);
  if (asked === null) return 0;
  return asked;
}
