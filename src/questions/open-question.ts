import { Notice, type App } from "obsidian";
import type { QuestionRecord, Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionToWriteIn } from "../campaign/session-to-write";
import { QuestionModal } from "./question-modal";
import { QuestionWriter } from "./question-writer";

const NO_SESSION = "Start a session first: answers are written into a session note.";

function questionAt(store: CampaignStore, source: Source): QuestionRecord | undefined {
  return store.current.questions.find((question) => question.source.path === source.path && question.source.line === source.line);
}

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openQuestion(app: App, store: CampaignStore, source: Source, onClosed: () => void): boolean {
  const question = questionAt(store, source);
  const folder = store.campaignFolder;
  if (question === undefined || folder === null) return false;
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, app.vault.getFiles().map((file) => file.path));
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return true;
  }
  const writer = new QuestionWriter(app.vault);
  const choices = {
    save: (edit: { answer: string; followUp: string }) => writer.save(question, edit, sessionPath),
    reopen: () => writer.reopen(question),
    delete: () => writer.delete(question),
  };
  new QuestionModal(app, question, sessionLabelOf(sessionPath), choices, onClosed).open();
  return true;
}
