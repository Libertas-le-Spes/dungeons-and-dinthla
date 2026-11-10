import type { QuestionRecord } from "../campaign/campaign";
import { currentThread } from "../campaign/current-thread";
import { keepsEveryPlace } from "../campaign/places";
import { questionThreadKind } from "../campaign/question-thread-kind";
import { latestSessionOf, placesOf } from "../campaign/thread-places";
import { followUpWouldGoElsewhere, sharesTextWithEarlierOpenThread } from "../campaign/thread-text-checks";

function answerTextOf(question: QuestionRecord): string | null {
  if (question.answer === null) return null;
  return question.answer.text;
}

function isSameQuestion(current: QuestionRecord, opened: QuestionRecord): boolean {
  const stillInPlace = keepsEveryPlace(placesOf(questionThreadKind, current), placesOf(questionThreadKind, opened));
  return stillInPlace && current.text === opened.text && answerTextOf(current) === answerTextOf(opened);
}

export function currentQuestion(questions: QuestionRecord[], opened: QuestionRecord): QuestionRecord {
  return currentThread(questions, opened, isSameQuestion);
}

export function sharesTextWithEarlierOpenQuestion(questions: QuestionRecord[], question: QuestionRecord): boolean {
  return sharesTextWithEarlierOpenThread(questionThreadKind, questions, question);
}

export function latestSessionOfQuestion(question: QuestionRecord, campaignFolder: string): number {
  return latestSessionOf(questionThreadKind, question, campaignFolder);
}

export const SAME_TEXT_AS_EXISTING = "A question already reads the same, so answers would be mixed up between them. Reword this one.";
export const ANSWER_GOES_ELSEWHERE = "That answer would be read as the answer to another question that starts the same way. Reword it.";

export function refusalForNewQuestion(questions: QuestionRecord[], text: string, answer: string): string | null {
  if (questions.some((existing) => existing.text === text)) return SAME_TEXT_AS_EXISTING;
  const standIn: QuestionRecord = { text, source: { path: "", line: 0 }, clues: [], answer: null };
  if (answerWouldGoElsewhere([...questions, standIn], standIn, answer)) return ANSWER_GOES_ELSEWHERE;
  return null;
}

export function answerWouldGoElsewhere(questions: QuestionRecord[], question: QuestionRecord, answer: string): boolean {
  return followUpWouldGoElsewhere(questionThreadKind, questions, question, answer);
}
