import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../../campaign/paths/session-to-write";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { newQuestion } from "../writing/new-question-change";
import type { NewQuestion } from "../writing/new-question";
import { NewQuestionModal } from "./new-question-modal";
import type { Gate } from "../../fence/gate/gatekeeper";

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
  const add = async (entry: NewQuestion) => writeInSession(gate.files, sessionPath, () => newQuestion(store, entry, sessionPath), writer);
  new NewQuestionModal(app, sessionLabelOf(sessionPath), add, onClosed).open();
}
