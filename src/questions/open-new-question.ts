import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestSession, SESSIONS_SHARE_A_NUMBER, sessionsSharingTheLatestNumber } from "../campaign/session-to-write";
import { questionTextOf } from "../notes/question-lines";
import { refusalForNewQuestion } from "./current-question";
import { NewQuestionModal, type NewQuestion } from "./new-question-modal";
import { QuestionWriter } from "./question-writer";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: questions are written into a session note.";

export function openNewQuestion(app: App, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = latestSession(folder, paths);
  if (sessionPath === null && sessionsSharingTheLatestNumber(folder, app.vault.getFiles().map((file) => file.path))) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestionWriter(app.vault);
  const add = async ({ question, answer }: NewQuestion) => {
    const text = questionTextOf(question);
    const refusal = refusalForNewQuestion(store.current.questions, text, answer);
    if (refusal !== null) throw new Error(refusal);
    return writer.add(text, answer, sessionPath);
  };
  new NewQuestionModal(app, sessionLabelOf(sessionPath), add, onClosed).open();
}
