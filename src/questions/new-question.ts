import { oneLine } from "../notes/parts/one-line";
import { answerLine, questionLine, questionTextOf } from "../notes/writing/question-lines";
import type { NewQuestion } from "./new-question-modal";

export interface NewQuestionPlan {
  text: string;
  answer: string;
  lines: string[];
}

function linesOf(text: string, answer: string): string[] {
  if (text === "") return [];
  const lines = [questionLine(text)];
  const written = oneLine(answer);
  if (written !== "") lines.push(answerLine(text, written));
  return lines;
}

export function planNewQuestion(entry: NewQuestion): NewQuestionPlan {
  const text = questionTextOf(entry.question);
  return { text, answer: entry.answer, lines: linesOf(text, entry.answer) };
}
