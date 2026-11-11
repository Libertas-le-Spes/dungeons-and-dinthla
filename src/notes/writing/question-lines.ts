import { questionTrackedKind } from "../../kinds/question-tracked-kind";
import { readMarker } from "../reading/marker";
import { followUpLine, openingAfterLine, openingTextOf } from "./thread-lines";

export function questionTextOf(text: string): string {
  return openingTextOf(questionTrackedKind.marker, text);
}

export function questionLine(question: string): string {
  return `${questionTrackedKind.marker.symbol} ${question}`;
}

export function answerLine(question: string, answer: string): string {
  return followUpLine("answer", question, answer);
}

export function followUpQuestionLine(followUp: string, question: string): string {
  return openingAfterLine(questionTrackedKind.marker, followUp, question);
}

export function isQuestionLine(written: string, question: string): boolean {
  const { marker, body } = readMarker(written);
  return marker === "question" && body === question;
}
