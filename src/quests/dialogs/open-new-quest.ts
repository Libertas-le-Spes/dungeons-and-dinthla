import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import { charactersIn } from "../../characters/reading/characters";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { latestSessionWanted } from "../../campaign/paths/session-to-write";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { NewQuestModal } from "./new-quest-modal";
import type { NewQuest } from "../writing/new-quest";
import { newQuest } from "../writing/new-quest-change";
import type { Gate } from "../../fence/gate/gatekeeper";

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
  const writer = new SessionChangeWriter(gate.notes.store);
  const opened = new OpenedSession(gate.notes.store, sessionPath);
  const add = async (entry: NewQuest) => writeInSession(opened, () => newQuest(store, entry, characters, sessionPath), writer);
  const names = characters.map((character) => character.name);
  new NewQuestModal(app, sessionLabelOf(sessionPath), names, add, onClosed).open();
}
