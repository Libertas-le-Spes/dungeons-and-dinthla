import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { NoteEditor } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER, sessionToWriteIn } from "../campaign/session-to-write";
import type { Source } from "../campaign/campaign";
import type { CoinLine } from "../notes/coin-lines";
import { coinEntryEdit, isLedgerLineEntry } from "./coin-entry";
import { CoinModal, type CoinOutcome } from "./coin-modal";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: coin is written into a session note.";

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openAddCoin(app: App, store: CampaignStore, onClosed: (outcome: CoinOutcome) => void): void {
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
  const add = (written: CoinLine) => editor.append(sessionPath, [written.line]);
  new CoinModal(app, sessionLabelOf(sessionPath), add, null, onClosed).open();
}

export function openCoinEntry(app: App, store: CampaignStore, source: Source, openNote: () => void, onClosed: (outcome: CoinOutcome) => void): void {
  const record = store.current.coins.find((coin) => coin.source.path === source.path && coin.source.line === source.line);
  if (record === undefined || !isLedgerLineEntry(record)) {
    openNote();
    return;
  }
  const edit = coinEntryEdit(app.vault, store, record);
  new CoinModal(app, sessionLabelOf(record.source.path), edit.save, edit, onClosed).open();
}
