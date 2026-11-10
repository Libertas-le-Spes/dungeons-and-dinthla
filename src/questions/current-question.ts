import type { QuestionRecord } from "../campaign/campaign";
import { currentThread, followUpWouldGoElsewhere, placesOf } from "../campaign/current-thread";
import { keepsEveryPlace } from "../campaign/places";

function answerTextOf(question: QuestionRecord): string | null {
  if (question.closing === null) return null;
  return question.closing.text;
}

function isSameQuestion(current: QuestionRecord, opened: QuestionRecord): boolean {
  const stillInPlace = keepsEveryPlace(placesOf(current), placesOf(opened));
  return stillInPlace && current.text === opened.text && answerTextOf(current) === answerTextOf(opened);
}

export function currentQuestion(questions: QuestionRecord[], opened: QuestionRecord): QuestionRecord {
  return currentThread(questions, opened, isSameQuestion);
}

export const SAME_TEXT_AS_EXISTING = "A question already reads the same, so answers would be mixed up between them. Reword this one.";
export const ANSWER_GOES_ELSEWHERE = "That answer would be read as the answer to another question that starts the same way. Reword it.";

export function refusalForNewQuestion(questions: QuestionRecord[], text: string, answer: string): string | null {
  if (questions.some((existing) => existing.text === text)) return SAME_TEXT_AS_EXISTING;
  const standIn: QuestionRecord = { text, source: { path: "", line: 0 }, notes: [], closing: null };
  if (followUpWouldGoElsewhere([...questions, standIn], standIn, answer)) return ANSWER_GOES_ELSEWHERE;
  return null;
}
