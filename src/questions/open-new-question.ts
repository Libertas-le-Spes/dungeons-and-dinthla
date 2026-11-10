import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionForDialog } from "../campaign/session-for-dialog";
import { latestSessionWanted } from "../campaign/session-to-write";
import { writeRecordChange } from "../campaign/write-record-change";
import { newQuestion } from "./new-question-change";
import { NewQuestionModal, type NewQuestion } from "./new-question-modal";
import type { Gate } from "../fence/gatekeeper";

const NO_SESSION = "Start a session first: questions are written into a session note.";

export function openNewQuestion(app: App, gate: Gate, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const sessionPath = sessionForDialog(gate.files, folder, latestSessionWanted(NO_SESSION));
  if (sessionPath === null) return;
  const writer = new SessionChangeWriter(gate.files);
  const add = async (entry: NewQuestion) => writeRecordChange(newQuestion(store, entry, sessionPath), writer);
  new NewQuestionModal(app, sessionLabelOf(sessionPath), add, onClosed).open();
}
