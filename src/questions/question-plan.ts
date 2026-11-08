import { buildCampaign } from "../campaign/build-campaign";
import type { Campaign, QuestionRecord, SessionNote } from "../campaign/campaign";
import type { Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { readMarker } from "../notes/marker";
import { appendLines, removeLines } from "../notes/note-lines";
import { answerLine, followUpQuestionLine, isFollowUpLine, oneLine, questionTextOf } from "../notes/question-lines";
import type { QuestionEdit } from "./question-writer";

export interface QuestionPlan {
  targetPath: string;
  added: string[];
  removal: Removal | null;
  expectedAnswer: string | null;
  followUpText: string | null;
}

export const CHANGES_ANOTHER_QUESTION =
  "That change would be read as changing more than asked, another question too, so nothing was written.";

function answerRemoval(question: QuestionRecord): Removal | null {
  const answer = question.answer;
  if (answer === null) return null;
  return {
    path: answer.source.path,
    line: answer.source.line,
    matches: (written) => isFollowUpLine(written, "answer", question.text, answer.text),
  };
}

export function planQuestionSave(question: QuestionRecord, edit: QuestionEdit, sessionPath: string): QuestionPlan {
  const answer = oneLine(edit.answer);
  const current = question.answer;
  let expectedAnswer: string | null = null;
  if (current !== null) expectedAnswer = oneLine(current.text);
  const added: string[] = [];
  let removal: Removal | null = null;
  let targetPath = sessionPath;
  if (answer !== expectedAnswer) {
    removal = answerRemoval(question);
    if (current !== null) targetPath = current.source.path;
    if (answer !== "") added.push(answerLine(question.text, answer));
    expectedAnswer = null;
    if (answer !== "") expectedAnswer = answer;
  }
  let followUpText: string | null = null;
  const followUp = questionTextOf(edit.followUp);
  if (followUp !== "") {
    const line = followUpQuestionLine(followUp, question.text);
    added.push(line);
    followUpText = readMarker(line).body;
  }
  if (added.length > 0 && removal === null) targetPath = sessionPath;
  return { targetPath, added, removal, expectedAnswer, followUpText };
}

export function planReopen(question: QuestionRecord, sessionPath: string): QuestionPlan {
  return planQuestionSave(question, { answer: "", followUp: "" }, sessionPath);
}

function applyPlan(sessions: SessionNote[], plan: QuestionPlan): SessionNote[] {
  return sessions.map((session) => {
    let text = session.text;
    if (plan.removal !== null && plan.removal.path === session.path) text = removeLines(text, [plan.removal]).text;
    if (session.path === plan.targetPath) text = appendLines(text, plan.added);
    return sessionNoteOf(session.path, session.number, text);
  });
}

function signatureOf(question: QuestionRecord, answer: string | null): string {
  return JSON.stringify([question.source.path, question.text, question.clues.map((clue) => oneLine(clue.text)), answer]);
}

function answerOf(question: QuestionRecord): string | null {
  if (question.answer === null) return null;
  return oneLine(question.answer.text);
}

function questionsBesidesFollowUp(campaign: Campaign, plan: QuestionPlan): QuestionRecord[] {
  const questions = [...campaign.questions];
  if (plan.followUpText === null) return questions;
  const index = questions.findLastIndex((question) => question.source.path === plan.targetPath && question.text === plan.followUpText);
  if (index === -1) return questions;
  const followUp = questions[index]!;
  if (followUp.clues.length > 0 || followUp.answer !== null) return [];
  questions.splice(index, 1);
  return questions;
}

export function refusalForQuestionPlan(sessions: SessionNote[], question: QuestionRecord, plan: QuestionPlan): string | null {
  const before = buildCampaign(sessions);
  const after = buildCampaign(applyPlan(sessions, plan));
  const wanted = before.questions.map((candidate) => {
    const isOpened = candidate.source.path === question.source.path && candidate.source.line === question.source.line;
    if (isOpened) return signatureOf(candidate, plan.expectedAnswer);
    return signatureOf(candidate, answerOf(candidate));
  });
  const found = questionsBesidesFollowUp(after, plan).map((candidate) => signatureOf(candidate, answerOf(candidate)));
  const purseUnchanged = after.purseCopper === before.purseCopper;
  if (JSON.stringify(wanted) === JSON.stringify(found) && purseUnchanged) return null;
  return CHANGES_ANOTHER_QUESTION;
}
