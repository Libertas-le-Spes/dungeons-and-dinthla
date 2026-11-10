import type { FollowUpName } from "../kinds/follow-up-name";
import { readFollowUp } from "./follow-up";
import { readMarker } from "./marker";

export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function questionTextOf(text: string): string {
  return oneLine(text).replace(/^\?\s*/, "");
}

export function questionLine(question: string): string {
  return `? ${question}`;
}

export function answerLine(question: string, answer: string): string {
  return `?= ${question}: ${oneLine(answer)}`;
}

export function followUpQuestionLine(followUp: string, question: string): string {
  return `? ${questionTextOf(followUp)}, after: ${question}`;
}

export function isQuestionLine(written: string, question: string): boolean {
  const { marker, body } = readMarker(written);
  return marker === "question" && body === question;
}

export function isFollowUpLine(written: string, kind: FollowUpName, question: string, note: string): boolean {
  const followUp = readFollowUp(written);
  if (followUp === null || followUp.kind !== kind || !followUp.text.startsWith(question)) return false;
  const afterQuestion = followUp.text.slice(question.length).trimStart();
  return afterQuestion.startsWith(":") && afterQuestion.slice(1).trim() === note;
}
