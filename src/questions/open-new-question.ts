import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestSession, SESSIONS_SHARE_A_NUMBER, latestNumberIsShared } from "../campaign/session-to-write";
import { questionTextOf } from "../notes/question-lines";
import { refusalForNewQuestion } from "./current-question";
import { NewQuestionModal, type NewQuestion } from "./new-question-modal";
import { QuestionWriter } from "./question-writer";
import type { Gate } from "../fence/gatekeeper";

const NO_SESSION = "Start a session first: questions are written into a session note.";

export function openNewQuestion(app: App, gate: Gate, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const paths = gate.files.getFiles().map((file) => file.path);
  const sessionPath = latestSession(folder, paths);
  if (sessionPath === null && latestNumberIsShared(folder, paths)) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestionWriter(gate.files);
  const add = async ({ question, answer }: NewQuestion) => {
    const text = questionTextOf(question);
    const refusal = refusalForNewQuestion(store.current.questions, text, answer);
    if (refusal !== null) throw new Error(refusal);
    return writer.add(text, answer, sessionPath);
  };
  new NewQuestionModal(app, sessionLabelOf(sessionPath), add, onClosed).open();
}
