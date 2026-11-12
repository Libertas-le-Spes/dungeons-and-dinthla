import { Notice, type App } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { currentQuestion, latestSessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "../writing/current-question";
import { questionReopen, questionSave } from "../writing/question-change";
import { QuestionModal } from "./question-modal";
import type { QuestionEdit } from "../writing/question-plan";
import { QuestionWriter } from "../writing/question-writer";
import type { Gate } from "../../fence/gate/gatekeeper";

const NO_SESSION = "Start a session first: answers are written into a session note.";
const SAME_TEXT = "An earlier open question reads the same, so an answer would go to it. Reword one of them first.";

export function openQuestion(
  app: App,
  gate: Gate,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
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
  const wanted = { activePath, earliestSession: latestSessionOfQuestion(question, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(gate.files, folder, wanted);
  if (sessionPath === null) return;
  const questionWriter = new QuestionWriter(gate.files);
  const writer = new SessionChangeWriter(gate.files);
  const latest = () => currentQuestion(store.current.questions, question);
  const choices = {
    save: async (edit: QuestionEdit) => writeInSession(gate.files, sessionPath, () => questionSave(store, latest(), edit, sessionPath), writer),
    reopen: () => writeInSession(gate.files, sessionPath, () => questionReopen(store, latest(), sessionPath), writer),
    delete: () => questionWriter.delete(latest()),
  };
  let answeredIn = sessionLabelOf(sessionPath);
  if (question.answer !== null) answeredIn = sessionLabelOf(question.answer.source.path);
  const places = { askedIn: sessionLabelOf(question.source.path), answeredIn, writesTo: sessionLabelOf(sessionPath) };
  new QuestionModal(app, question, places, choices, onClosed).open();
}
