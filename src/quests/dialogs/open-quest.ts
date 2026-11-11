import { Notice, type App } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { writeRecordChange } from "../../campaign/changes/write-record-change";
import { currentQuest, latestSessionOfQuest, SAME_TITLE, sharesTitleWithEarlierActiveQuest } from "../writing/current-quest";
import { questSave } from "../writing/quest-change";
import { QuestModal } from "./quest-modal";
import { canCollectReward, type QuestEdit } from "../writing/quest-plan";
import { QuestWriter } from "../writing/quest-writer";
import type { Gate } from "../../fence/gatekeeper";

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
  if (sharesTitleWithEarlierActiveQuest(quests, record)) {
    new Notice(SAME_TITLE);
    openNote();
    return;
  }
  const wanted = { activePath, earliestSession: latestSessionOfQuest(record, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(gate.files, folder, wanted);
  if (sessionPath === null) return;
  const questWriter = new QuestWriter(gate.files);
  const writer = new SessionChangeWriter(gate.files);
  const latest = () => currentQuest(store.current.quests, record);
  const choices = {
    save: async (edit: QuestEdit) => writeRecordChange(questSave(store, latest(), edit, sessionPath), writer),
    delete: () => questWriter.delete(latest()),
  };
  let finishedIn = sessionLabelOf(sessionPath);
  if (record.outcome !== null) finishedIn = sessionLabelOf(record.outcome.source.path);
  const places = { givenIn: sessionLabelOf(record.source.path), finishedIn, writesTo: sessionLabelOf(sessionPath) };
  new QuestModal(app, record, places, canCollectReward(record, store.current.coins), choices, onClosed).open();
}
