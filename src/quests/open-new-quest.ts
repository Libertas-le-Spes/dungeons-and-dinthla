import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestSession, SESSIONS_SHARE_A_NUMBER, sessionsSharingTheLatestNumber } from "../campaign/session-to-write";
import { NewQuestModal } from "./new-quest-modal";
import { planNewQuest, refusalForNewQuest, type Character, type NewQuest } from "./new-quest";
import { QuestWriter } from "./quest-writer";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: quests are written into a session note.";

function charactersIn(app: App, folder: string, sessionPath: string): Character[] {
  const charactersFolder = `${folder}/Characters/`;
  const characters: Character[] = [];
  for (const file of app.vault.getMarkdownFiles()) {
    if (!file.path.startsWith(charactersFolder)) continue;
    if (characters.some((character) => character.name === file.basename)) continue;
    characters.push({ name: file.basename, linktext: app.metadataCache.fileToLinktext(file, sessionPath, true) });
  }
  return characters.sort((first, second) => first.name.localeCompare(second.name));
}

export function openNewQuest(app: App, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const sessionPath = latestSession(folder, app.vault.getFiles().map((file) => file.path));
  if (sessionPath === null && sessionsSharingTheLatestNumber(folder, app.vault.getFiles().map((file) => file.path))) {
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
