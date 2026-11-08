import { Notice, type App } from "obsidian";
import type { QuestionRecord, Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { SESSIONS_SHARE_A_NUMBER, latestNumberIsShared, sessionToWriteIn } from "../campaign/session-to-write";
import { ANSWER_GOES_ELSEWHERE, answerWouldGoElsewhere, currentQuestion, latestSessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "./current-question";
import { QuestionModal } from "./question-modal";
import { planQuestionSave, planReopen, refusalForQuestionPlan, type QuestionEdit, type QuestionPlan } from "./question-plan";
import { QuestionWriter } from "./question-writer";
import { activePathOf } from "../views/open-view";

const NO_SESSION = "Start a session first: answers are written into a session note.";
const SAME_TEXT = "An earlier open question reads the same, so an answer would go to it. Reword one of them first.";

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
  if (sessionPath === null && latestNumberIsShared(folder, paths)) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestionWriter(app.vault);
  const checkedApply = async (current: QuestionRecord, plan: QuestionPlan) => {
    const refusal = refusalForQuestionPlan(store.sessionNotes, current, plan);
    if (refusal !== null) throw new Error(refusal);
    return writer.apply(plan);
  };
  const latest = () => currentQuestion(store.current.questions, question);
  const choices = {
    save: async (edit: QuestionEdit) => {
      const current = latest();
      if (answerWouldGoElsewhere(store.current.questions, current, edit.answer)) throw new Error(ANSWER_GOES_ELSEWHERE);
      return checkedApply(current, planQuestionSave(current, edit, sessionPath));
    },
    reopen: () => {
      const current = latest();
      return checkedApply(current, planReopen(current, sessionPath));
    },
    delete: () => writer.delete(latest()),
  };
  let answeredIn = sessionLabelOf(sessionPath);
  if (question.answer !== null) answeredIn = sessionLabelOf(question.answer.source.path);
  const places = { askedIn: sessionLabelOf(question.source.path), answeredIn, writesTo: sessionLabelOf(sessionPath) };
  new QuestionModal(app, question, places, choices, onClosed).open();
}
