import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import { charactersIn } from "../campaign/characters";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestSession, SESSIONS_SHARE_A_NUMBER, latestNumberIsShared } from "../campaign/session-to-write";
import { NewQuestModal } from "./new-quest-modal";
import { planNewQuest, refusalForNewQuest, type NewQuest } from "./new-quest";
import { QuestWriter } from "./quest-writer";

const NO_SESSION = "Start a session first: quests are written into a session note.";

export function openNewQuest(app: App, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = latestSession(folder, paths);
  if (sessionPath === null && latestNumberIsShared(folder, paths)) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const characters = charactersIn(app, folder, sessionPath);
  const writer = new QuestWriter(app.vault);
  const add = async (entry: NewQuest) => {
    const plan = planNewQuest(entry, characters);
    if (plan.title === "") return false;
    const refusal = refusalForNewQuest(store.current.quests, plan);
    if (refusal !== null) throw new Error(refusal);
    return writer.add(plan.line, sessionPath);
  };
  const names = characters.map((character) => character.name);
  new NewQuestModal(app, sessionLabelOf(sessionPath), names, add, onClosed).open();
}
