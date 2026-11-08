import { buildCampaign } from "../campaign/build-campaign";
import type { Campaign, QuestionRecord, SessionNote, SourcedText } from "../campaign/campaign";
import type { Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { readMarker } from "../notes/marker";
import { appendLines, removeLines } from "../notes/note-lines";
import { answerLine, followUpQuestionLine, isFollowUpLine, oneLine, questionTextOf } from "../notes/question-lines";

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
  const answer = question.answer;
  if (answer === null) return null;
  return {
    path: answer.source.path,
    line: answer.source.line,
    matches: (written) => isFollowUpLine(written, "answer", question.text, answer.text),
  };
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

export function applyQuestionPlan(sessions: SessionNote[], plan: QuestionPlan): SessionNote[] {
  return sessions.map((session) => {
    let text = session.text;
    if (plan.removal !== null && plan.removal.path === session.path) text = removeLines(text, [plan.removal]).text;
    if (session.path === plan.answerPath) text = appendLines(text, plan.answerLines);
    if (session.path === plan.followUpPath) text = appendLines(text, plan.followUpLines);
    return sessionNoteOf(session.path, session.number, text);
  });
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

function followUpIndex(campaign: Campaign, plan: QuestionPlan): number {
  if (plan.followUpText === null) return -1;
  return campaign.questions.findLastIndex((question) => question.source.path === plan.followUpPath && question.text === plan.followUpText);
}

export function refusalForQuestionPlan(sessions: SessionNote[], question: QuestionRecord, plan: QuestionPlan): string | null {
  const known = new Set(sessions.map((session) => session.path));
  if (!known.has(plan.answerPath) || !known.has(plan.followUpPath)) return CHANGES_MORE_THAN_ASKED;
  const before = buildCampaign(sessions);
  if (plan.followUpText !== null && before.questions.some((existing) => existing.text === plan.followUpText)) return FOLLOW_UP_ALREADY_ASKED;
  const after = buildCampaign(applyQuestionPlan(sessions, plan));
  const wanted = before.questions.map((candidate) => {
    const isOpened = candidate.source.path === question.source.path && candidate.source.line === question.source.line;
    if (isOpened) return signatureOf(candidate, plan.expectedAnswer);
    return signatureOf(candidate, answerOf(candidate));
  });
  const questions = [...after.questions];
  const index = followUpIndex(after, plan);
  let followUpStartsFresh = true;
  if (index !== -1) {
    const followUp = questions.splice(index, 1)[0]!;
    followUpStartsFresh = followUp.clues.length === 0 && followUp.answer === null;
  }
  const found = questions.map((candidate) => signatureOf(candidate, answerOf(candidate)));
  if (followUpStartsFresh && JSON.stringify(wanted) === JSON.stringify(found)) return null;
  return CHANGES_MORE_THAN_ASKED;
}
