import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../../campaign/paths/session-to-write";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { newQuestion } from "../writing/new-question-change";
import type { NewQuestion } from "../writing/new-question";
import { NewQuestionDialog } from "./new-question-dialog";
import type { NoteStore } from "../../host/notes/note-store";
import type { DialogShowing } from "../../views/dialogs/dialog-view";

const NO_SESSION = "Start a session first: questions are written into a session note.";

export function openNewQuestion(showing: DialogShowing, notes: Pick<NoteStore, "files" | "note" | "read" | "change">, store: CampaignStore, onClosed: () => void, syntax: PropertiesSyntax): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    showing.telling.say(NO_CAMPAIGN);
    return;
  }
  const sessionPath = sessionForDialog(notes, showing.telling, folder, latestSessionWanted(NO_SESSION));
  if (sessionPath === null) return;
  const writer = new SessionChangeWriter(notes, syntax);
  const opened = new OpenedSession(notes, sessionPath);
  const add = async (entry: NewQuestion) => writeInSession(opened, () => newQuestion(store, entry, sessionPath, syntax), writer);
  showing.dialogs.open(new NewQuestionDialog(showing.telling, sessionLabelOf(sessionPath), add, onClosed));
}
