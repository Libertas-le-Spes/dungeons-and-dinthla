import { applySessionChange } from "../campaign/changes/apply-session-change";
import { buildCampaign } from "../campaign/reading/build-campaign";
import type { Campaign, QuestionRecord, SessionNote, SourcedText } from "../campaign/record/campaign";
import type { Removal } from "../campaign/writing/note-editor";
import { questionThreadKind } from "../campaign/threads/question-thread-kind";
import { endingRemoval } from "../campaign/threads/thread-removal";
import { readMarker } from "../notes/marker";
import { oneLine } from "../notes/one-line";
import { answerLine, followUpQuestionLine, questionTextOf } from "../notes/question-lines";
import { questionSessionChange } from "./question-session-change";

export interface QuestionEdit {
  answer: string;
  followUp: string;
}

export interface QuestionPlan {
  answerPath: string;
  answerLines: string[];
  removal: Removal | null;
  followUpPath: string;
  followUpLines: string[];
  expectedAnswer: string | null;
  followUpText: string | null;
}

export const CHANGES_MORE_THAN_ASKED = "That change wouldn't be read as asked, or would change more than asked, so nothing was written.";
export const FOLLOW_UP_ALREADY_ASKED = "A question already reads like that follow-up, so answers would be mixed up. Reword it.";

export function answerRemoval(question: QuestionRecord): Removal | null {
  return endingRemoval(questionThreadKind, question);
}

function placedAnswer(path: string, text: string): string {
  return JSON.stringify([path, text]);
}

export function planQuestionSave(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): QuestionPlan {
  const newAnswer = oneLine(edit.answer);
  const oldAnswer = question.answer;
  let expectedAnswer: string | null = null;
  if (oldAnswer !== null) expectedAnswer = placedAnswer(oldAnswer.source.path, oneLine(oldAnswer.text));
  let oldText = "";
  if (oldAnswer !== null) oldText = oneLine(oldAnswer.text);
  const answerChanged = newAnswer !== oldText;
  let answerPath = sessionPath;
  const answerLines: string[] = [];
  let removal: Removal | null = null;
  if (answerChanged) {
    removal = answerRemoval(question);
    if (oldAnswer !== null) answerPath = oldAnswer.source.path;
    expectedAnswer = null;
    if (newAnswer !== "") {
      answerLines.push(answerLine(question.text, newAnswer));
      expectedAnswer = placedAnswer(answerPath, newAnswer);
    }
  }
  const followUpLines: string[] = [];
  let followUpText: string | null = null;
  const followUp = questionTextOf(edit.followUp);
  if (followUp !== "") {
    const line = followUpQuestionLine(followUp, question.text);
    followUpLines.push(line);
    followUpText = readMarker(line).body;
  }
  return { answerPath, answerLines, removal, followUpPath: sessionPath, followUpLines, expectedAnswer, followUpText };
}

export function planReopen(question: QuestionRecord, sessionPath: string): QuestionPlan {
  return planQuestionSave(question, { answer: "", followUp: "" }, sessionPath);
}

function placedClues(clues: SourcedText[]): string[] {
  return clues.map((clue) => placedAnswer(clue.source.path, oneLine(clue.text)));
}

function answerOf(question: QuestionRecord): string | null {
  if (question.answer === null) return null;
  return placedAnswer(question.answer.source.path, oneLine(question.answer.text));
}

function signatureOf(question: QuestionRecord, answer: string | null): string {
  return JSON.stringify([question.source.path, question.text, placedClues(question.clues), answer]);
}

function followUpOf(campaign: Campaign, plan: QuestionPlan): QuestionRecord | undefined {
  if (plan.followUpText === null) return undefined;
  return campaign.questions.filter((question) => question.source.path === plan.followUpPath && question.text === plan.followUpText).pop();
}

export function refusalForQuestionPlan(sessions: SessionNote[], question: QuestionRecord, plan: QuestionPlan): string | null {
  const known = new Set(sessions.map((session) => session.path));
  if (!known.has(plan.answerPath) || !known.has(plan.followUpPath)) return CHANGES_MORE_THAN_ASKED;
  const before = buildCampaign(sessions);
  if (plan.followUpText !== null && before.questions.some((existing) => existing.text === plan.followUpText)) return FOLLOW_UP_ALREADY_ASKED;
  const after = buildCampaign(applySessionChange(sessions, questionSessionChange(plan)).sessions);
  const wanted = before.questions.map((candidate) => {
    const isOpened = candidate.source.path === question.source.path && candidate.source.line === question.source.line;
    if (isOpened) return signatureOf(candidate, plan.expectedAnswer);
    return signatureOf(candidate, answerOf(candidate));
  });
  const followUp = followUpOf(after, plan);
  const questions = after.questions.filter((candidate) => candidate !== followUp);
  let followUpStartsFresh = true;
  if (followUp !== undefined) followUpStartsFresh = followUp.clues.length === 0 && followUp.answer === null;
  const found = questions.map((candidate) => signatureOf(candidate, answerOf(candidate)));
  if (followUpStartsFresh && JSON.stringify(wanted) === JSON.stringify(found)) return null;
  return CHANGES_MORE_THAN_ASKED;
}
