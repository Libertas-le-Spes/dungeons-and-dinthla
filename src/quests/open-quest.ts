import { Notice, type App } from "obsidian";
import type { Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionForDialog } from "../campaign/session-for-dialog";
import { followUpWouldGoElsewhere, latestSessionOf, sharesTextWithEarlierOpenThread } from "../campaign/current-thread";
import { currentQuest, GOES_ELSEWHERE, SAME_TITLE } from "./current-quest";
import { QuestModal } from "./quest-modal";
import { canCollectReward, planQuestSave, refusalForQuestPlan, type QuestEdit } from "./quest-plan";
import { QuestWriter } from "./quest-writer";
import type { Gate } from "../fence/gatekeeper";

const NO_SESSION = "Start a session first: quest changes are written into a session note.";

export function openQuest(
  app: App,
  gate: Gate,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
): void {
  const quests = store.current.quests;
  const record = quests.find((candidate) => candidate.source.path === source.path && candidate.source.line === source.line);
  const folder = store.campaignFolder;
  if (record === undefined || folder === null) {
    openNote();
    return;
  }
  if (sharesTextWithEarlierOpenThread(quests, record)) {
    new Notice(SAME_TITLE);
    openNote();
    return;
  }
  const wanted = { activePath, earliestSession: latestSessionOf(record, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(gate.files, folder, wanted);
  if (sessionPath === null) return;
  const writer = new QuestWriter(gate.files);
  const latest = () => currentQuest(store.current.quests, record);
  const choices = {
    save: async (edit: QuestEdit) => {
      const current = latest();
      if (followUpWouldGoElsewhere(store.current.quests, current, edit.happened)) throw new Error(GOES_ELSEWHERE);
      const plan = planQuestSave(current, edit, store.current.coins, sessionPath);
      const refusal = refusalForQuestPlan(store.sessionNotes, current, plan);
      if (refusal !== null) throw new Error(refusal);
      return writer.apply(plan);
    },
    delete: () => writer.delete(latest()),
  };
  let finishedIn = sessionLabelOf(sessionPath);
  if (record.closing !== null) finishedIn = sessionLabelOf(record.closing.source.path);
  const places = { givenIn: sessionLabelOf(record.source.path), finishedIn, writesTo: sessionLabelOf(sessionPath) };
  new QuestModal(app, record, places, canCollectReward(record, store.current.coins), choices, onClosed).open();
}
