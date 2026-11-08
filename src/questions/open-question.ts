import { Notice, type App } from "obsidian";
import type { QuestionRecord, Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf, sessionNumberOf } from "../campaign/session-file";
import { sessionToWriteIn } from "../campaign/session-to-write";
import { QuestionModal } from "./question-modal";
import { CHANGED_IN_NOTE, QuestionWriter, type QuestionEdit } from "./question-writer";

const NO_SESSION = "Start a session first: answers are written into a session note.";
const SAME_TEXT = "An earlier open question reads the same, so an answer would go to it. Reword one of them first.";

function isAt(question: QuestionRecord, source: Source): boolean {
  return question.source.path === source.path && question.source.line === source.line;
}

function questionAt(store: CampaignStore, source: Source): QuestionRecord {
  const question = store.current.questions.find((candidate) => isAt(candidate, source));
  if (question === undefined) throw new Error(CHANGED_IN_NOTE);
  return question;
}

function sharesTextWithEarlierOpenQuestion(store: CampaignStore, question: QuestionRecord): boolean {
  const index = store.current.questions.indexOf(question);
  return store.current.questions.slice(0, index).some((earlier) => earlier.answer === null && earlier.text === question.text);
}

function earliestSessionFor(question: QuestionRecord, folder: string): number {
  const asked = sessionNumberOf(question.source.path, folder);
  let earliest = 0;
  if (asked !== null) earliest = asked;
  if (question.answer === null) return earliest;
  const answered = sessionNumberOf(question.answer.source.path, folder);
  if (answered !== null && answered > earliest) earliest = answered;
  return earliest;
}

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openQuestion(
  app: App,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
): void {
  const question = store.current.questions.find((candidate) => isAt(candidate, source));
  const folder = store.campaignFolder;
  if (question === undefined || folder === null) {
    openNote();
    return;
  }
  if (sharesTextWithEarlierOpenQuestion(store, question)) {
    new Notice(SAME_TEXT);
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, paths, earliestSessionFor(question, folder));
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestionWriter(app.vault);
  const choices = {
    save: (edit: QuestionEdit) => writer.save(questionAt(store, source), edit, sessionPath),
    reopen: () => writer.reopen(questionAt(store, source)),
    delete: () => writer.delete(questionAt(store, source)),
  };
  const places = { askedIn: sessionLabelOf(question.source.path), writesTo: sessionLabelOf(sessionPath) };
  new QuestionModal(app, question, places, choices, onClosed).open();
}
