import { Notice, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionToWriteIn } from "../campaign/session-to-write";
import { currentQuest, GOES_ELSEWHERE, happenedWouldGoElsewhere, latestSessionOfQuest, SAME_TITLE, sharesTitleWithEarlierActiveQuest } from "./current-quest";
import { QuestModal } from "./quest-modal";
import { canCollectReward, planQuestSave, refusalForQuestPlan, type QuestEdit } from "./quest-plan";
import { QuestWriter } from "./quest-writer";

const NO_SESSION = "Start a session first: quest changes are written into a session note.";

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openQuest(
  app: App,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
): void {
  const quests = store.current.quests;
  const record = quests.find((candidate) => candidate.source.path === source.path && candidate.source.line === source.line);
  const folder = store.campaignFolder;
  if (record === undefined || folder === null) {
    openNote();
    return;
  }
  if (sharesTitleWithEarlierActiveQuest(quests, record)) {
    new Notice(SAME_TITLE);
    openNote();
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, paths, latestSessionOfQuest(record, folder));
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const writer = new QuestWriter(app.vault);
  const latest = () => currentQuest(store.current.quests, record);
  const choices = {
    save: async (edit: QuestEdit) => {
      const current = latest();
      if (happenedWouldGoElsewhere(store.current.quests, current, edit.happened)) throw new Error(GOES_ELSEWHERE);
      const plan = planQuestSave(current, edit, store.current.coins, sessionPath);
      const refusal = refusalForQuestPlan(store.sessionNotes, current, plan);
      if (refusal !== null) throw new Error(refusal);
      return writer.apply(plan);
    },
    delete: () => writer.delete(latest()),
  };
  const places = { givenIn: sessionLabelOf(record.source.path), writesTo: sessionLabelOf(sessionPath) };
  new QuestModal(app, record, places, canCollectReward(record, store.current.coins), choices, onClosed).open();
}
