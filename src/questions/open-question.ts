import { Notice, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionToWriteIn } from "../campaign/session-to-write";
import { answerWouldGoElsewhere, currentQuestion, latestSessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "./current-question";
import { QuestionModal } from "./question-modal";
import { QuestionWriter, type QuestionEdit } from "./question-writer";

const NO_SESSION = "Start a session first: answers are written into a session note.";
const SAME_TEXT = "An earlier open question reads the same, so an answer would go to it. Reword one of them first.";
const ANSWER_GOES_ELSEWHERE = "That answer would be read as the answer to another question that starts the same way. Reword it.";

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
  const questions = store.current.questions;
  const question = questions.find((candidate) => candidate.source.path === source.path && candidate.source.line === source.line);
  const folder = store.campaignFolder;
  if (question === undefined || folder === null) {
    openNote();
    return;
  }
  if (sharesTextWithEarlierOpenQuestion(questions, question)) {
    new Notice(SAME_TEXT);
    openNote();
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, paths, latestSessionOfQuestion(question, folder));
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestionWriter(app.vault);
  const latest = () => currentQuestion(store.current.questions, question);
  const choices = {
    save: async (edit: QuestionEdit) => {
      const current = latest();
      if (answerWouldGoElsewhere(store.current.questions, current, edit.answer)) throw new Error(ANSWER_GOES_ELSEWHERE);
      return writer.save(current, edit, sessionPath);
    },
    reopen: () => writer.reopen(latest()),
    delete: () => writer.delete(latest()),
  };
  const places = { askedIn: sessionLabelOf(question.source.path), writesTo: sessionLabelOf(sessionPath) };
  new QuestionModal(app, question, places, choices, onClosed).open();
}
