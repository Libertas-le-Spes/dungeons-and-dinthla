import { Notice, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionForDialog } from "../campaign/session-for-dialog";
import { writeRecordChange } from "../campaign/write-record-change";
import { currentQuestion, latestSessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "./current-question";
import { questionReopen, questionSave } from "./question-change";
import { QuestionModal } from "./question-modal";
import type { QuestionEdit } from "./question-plan";
import { QuestionWriter } from "./question-writer";
import type { Gate } from "../fence/gatekeeper";

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
  const writer = new QuestionWriter(gate.files);
  const latest = () => currentQuestion(store.current.questions, question);
  const choices = {
    save: async (edit: QuestionEdit) => writeRecordChange(questionSave(store, latest(), edit, sessionPath, writer)),
    reopen: () => writeRecordChange(questionReopen(store, latest(), sessionPath, writer)),
    delete: () => writer.delete(latest()),
  };
  let answeredIn = sessionLabelOf(sessionPath);
  if (question.answer !== null) answeredIn = sessionLabelOf(question.answer.source.path);
  const places = { askedIn: sessionLabelOf(question.source.path), answeredIn, writesTo: sessionLabelOf(sessionPath) };
  new QuestionModal(app, question, places, choices, onClosed).open();
}
