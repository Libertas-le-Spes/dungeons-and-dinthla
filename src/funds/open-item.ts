import { Notice, type App } from "obsidian";
import type { ItemRecord } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { sessionLabelOf } from "../campaign/session-file";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER, sessionToWriteIn } from "../campaign/session-to-write";
import { ItemModal } from "./item-modal";
import { holderOptions, latestSessionOfItem, type HolderOption } from "./item-plan";
import { itemSaver } from "./item-writer";

const NO_SESSION = "Start a session first: item changes are written into a session note.";

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

function itemNamed(items: ItemRecord[], name: string): ItemRecord | undefined {
  return items.find((item) => item.name === name);
}

function charactersIn(app: App, campaignFolder: string, sessionPath: string): HolderOption[] {
  const folder = `${campaignFolder}/Characters/`;
  return app.vault
    .getMarkdownFiles()
    .filter((file) => file.path.startsWith(folder))
    .map((file) => ({ text: `[[${app.metadataCache.fileToLinktext(file, sessionPath)}]]`, label: file.basename }));
}

export function openItem(app: App, store: CampaignStore, name: string, openNote: () => void, onClosed: (changed: boolean) => void): void {
  const item = itemNamed(store.current.items, name);
  const folder = store.campaignFolder;
  if (item === undefined || folder === null) {
    openNote();
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, paths, latestSessionOfItem(item, folder));
  if (sessionPath === null && latestNumberIsShared(folder, paths)) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const holders = holderOptions(
    store.current.items.map((candidate) => candidate.holder),
    charactersIn(app, folder, sessionPath),
  );
  new ItemModal(app, item, holders, sessionLabelOf(sessionPath), itemSaver(app.vault, store, name, sessionPath), onClosed).open();
}
