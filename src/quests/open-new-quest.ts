import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestSession } from "../campaign/session-to-write";
import { NewQuestModal } from "./new-quest-modal";
import { planNewQuest, refusalForNewQuest, type NewQuest } from "./new-quest";
import { QuestWriter } from "./quest-writer";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: quests are written into a session note.";

function charactersIn(app: App, folder: string): string[] {
  const charactersFolder = `${folder}/Characters/`;
  return app.vault
    .getFiles()
    .filter((file) => file.path.startsWith(charactersFolder) && file.extension === "md")
    .map((file) => file.basename)
    .sort();
}

export function openNewQuest(app: App, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const sessionPath = latestSession(folder, app.vault.getFiles().map((file) => file.path));
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const characters = charactersIn(app, folder);
  const writer = new QuestWriter(app.vault);
  const add = async (entry: NewQuest) => {
    const plan = planNewQuest(entry, characters);
    if (plan.title === "") return false;
    const refusal = refusalForNewQuest(store.current.quests, plan);
    if (refusal !== null) throw new Error(refusal);
    return writer.add(plan.line, sessionPath);
  };
  new NewQuestModal(app, sessionLabelOf(sessionPath), characters, add, onClosed).open();
}
