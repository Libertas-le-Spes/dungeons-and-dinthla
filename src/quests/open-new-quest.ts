import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/paths/campaign-folders";
import { charactersIn } from "../characters/reading/characters";
import type { CampaignStore } from "../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../campaign/paths/session-file";
import { sessionForDialog } from "../campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../campaign/paths/session-to-write";
import { writeRecordChange } from "../campaign/changes/write-record-change";
import { NewQuestModal } from "./new-quest-modal";
import type { NewQuest } from "./new-quest";
import { newQuest } from "./new-quest-change";
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
  const writer = new SessionChangeWriter(gate.files);
  const add = async (entry: NewQuest) => writeRecordChange(newQuest(store, entry, characters, sessionPath), writer);
  const names = characters.map((character) => character.name);
  new NewQuestModal(app, sessionLabelOf(sessionPath), names, add, onClosed).open();
}
