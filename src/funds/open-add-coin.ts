import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { NoteEditor } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER, sessionToWriteIn } from "../campaign/session-to-write";
import { CoinModal } from "./coin-modal";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: coin is written into a session note.";

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openAddCoin(app: App, store: CampaignStore, onClosed: () => void): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const paths = app.vault.getFiles().map((file) => file.path);
  const sessionPath = sessionToWriteIn(activePathOf(app), folder, paths, 0);
  if (sessionPath === null && latestNumberIsShared(folder, paths)) {
    new Notice(SESSIONS_SHARE_A_NUMBER);
    return;
  }
  if (sessionPath === null) {
    new Notice(NO_SESSION);
    return;
  }
  const editor = new NoteEditor(app.vault);
  const add = (line: string) => editor.append(sessionPath, [line]);
  new CoinModal(app, sessionLabelOf(sessionPath), add, onClosed).open();
}
