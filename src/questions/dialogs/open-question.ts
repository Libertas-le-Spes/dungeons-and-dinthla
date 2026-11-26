import type { Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { currentQuestion, latestSessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "../writing/current-question";
import { questionReopen, questionSave } from "../writing/question-change";
import { QuestionDialog } from "./question-dialog";
import type { QuestionEdit } from "../writing/question-plan";
import { QuestionWriter } from "../writing/question-writer";
import type { NoteStore } from "../../host/notes/note-store";
import type { DialogShowing } from "../../views/dialogs/dialog-view";

const NO_SESSION = "Start a session first: answers are written into a session note.";
const SAME_TEXT = "An earlier open question reads the same, so an answer would go to it. Reword one of them first.";

export function openQuestion(
  showing: DialogShowing,
  notes: Pick<NoteStore, "files" | "note" | "read" | "change">,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
  syntax: PropertiesSyntax,
): void {
  const questions = store.current.questions;
  const question = questions.find((candidate) => candidate.source.path === source.path && candidate.source.line === source.line);
  const folder = store.campaignFolder;
  if (question === undefined || folder === null) {
    openNote();
    return;
  }
  if (sharesTextWithEarlierOpenQuestion(questions, question)) {
    showing.telling.say(SAME_TEXT);
    openNote();
    return;
  }
  const wanted = { activePath, earliestSession: latestSessionOfQuestion(question, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(notes, showing.telling, folder, wanted);
  if (sessionPath === null) return;
  const questionWriter = new QuestionWriter(notes, syntax);
  const writer = new SessionChangeWriter(notes, syntax);
  const opened = new OpenedSession(notes, sessionPath);
  const latest = () => currentQuestion(store.current.questions, question);
  const choices = {
    save: async (edit: QuestionEdit) => writeInSession(opened, () => questionSave(store, latest(), edit, sessionPath, syntax), writer),
    reopen: () => writeInSession(opened, () => questionReopen(store, latest(), sessionPath, syntax), writer),
    delete: async () => questionWriter.delete(latest()),
  };
  let answeredIn = sessionLabelOf(sessionPath);
  if (question.answer !== null) answeredIn = sessionLabelOf(question.answer.source.path);
  const places = { askedIn: sessionLabelOf(question.source.path), answeredIn, writesTo: sessionLabelOf(sessionPath) };
  showing.dialogs.open(new QuestionDialog(showing.telling, question, places, choices, onClosed));
}
