import type { QuestionRecord } from "../campaign/campaign";
import { sessionNumberOf } from "../campaign/session-file";
import { findSubject } from "../campaign/subject";
import { oneLine } from "../notes/question-lines";
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

export function latestSessionOfQuestion(question: QuestionRecord, campaignFolder: string): number {
  const sources = [question.source, ...question.clues.map((clue) => clue.source)];
  if (question.answer !== null) sources.push(question.answer.source);
  let latest = 0;
  for (const source of sources) {
    const number = sessionNumberOf(source.path, campaignFolder);
    if (number !== null && number > latest) latest = number;
  }
  return latest;
}

export const SAME_TEXT_AS_EXISTING = "A question already reads the same, so answers would be mixed up between them. Reword this one.";
export const ANSWER_GOES_ELSEWHERE = "That answer would be read as the answer to another question that starts the same way. Reword it.";

export function refusalForNewQuestion(questions: QuestionRecord[], text: string, answer: string, sessionPath: string): string | null {
  if (questions.some((existing) => existing.text === text)) return SAME_TEXT_AS_EXISTING;
  const standIn: QuestionRecord = { text, source: { path: sessionPath, line: -1 }, clues: [], answer: null };
  if (oneLine(answer) !== "" && answerWouldGoElsewhere([...questions, standIn], standIn, answer)) return ANSWER_GOES_ELSEWHERE;
  return null;
}

export function answerWouldGoElsewhere(questions: QuestionRecord[], question: QuestionRecord, answer: string): boolean {
  const open = questions.filter((candidate) => candidate === question || candidate.answer === null);
  const found = findSubject(`${question.text}: ${oneLine(answer)}`, open, (candidate) => candidate.text);
  return found !== null && found.candidate !== question;
}
