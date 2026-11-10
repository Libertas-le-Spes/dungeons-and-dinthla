import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import { charactersIn } from "../campaign/characters";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionForDialog } from "../campaign/session-for-dialog";
import { latestSessionWanted } from "../campaign/session-to-write";
import { writeRecordChange } from "../campaign/write-record-change";
import { NewQuestModal } from "./new-quest-modal";
import type { NewQuest } from "./new-quest";
import { newQuestAdd } from "./new-quest-change";
import { QuestWriter } from "./quest-writer";
import type { Gate } from "../fence/gatekeeper";

const NO_SESSION = "Start a session first: quests are written into a session note.";

export function openNewQuest(app: App, gate: Gate, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const sessionPath = sessionForDialog(gate.files, folder, latestSessionWanted(NO_SESSION));
  if (sessionPath === null) return;
  const characters = charactersIn(gate, folder, sessionPath);
  const writer = new QuestWriter(gate.files);
  const add = async (entry: NewQuest) => writeRecordChange(newQuestAdd(store, entry, characters, sessionPath, writer));
  const names = characters.map((character) => character.name);
  new NewQuestModal(app, sessionLabelOf(sessionPath), names, add, onClosed).open();
}
