import { Notice, type App } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { NoteEditor } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { latestNumberIsShared, SESSIONS_SHARE_A_NUMBER, sessionToWriteIn } from "../campaign/session-to-write";
import type { Source } from "../campaign/campaign";
import { draftOf } from "../notes/coin-lines";
import { readLedgerEntry } from "../notes/ledger";
import { readMarker } from "../notes/marker";
import { entryRemoval, isLedgerLineEntry, refusalForEntryChange } from "./coin-entry";
import { CoinModal } from "./coin-modal";

const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";
const NO_SESSION = "Start a session first: coin is written into a session note.";

function activePathOf(app: App): string | null {
  const file = app.workspace.getActiveFile();
  if (file === null) return null;
  return file.path;
}

export function openAddCoin(app: App, store: CampaignStore, onClosed: (changed: boolean) => void): void {
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
  new CoinModal(app, sessionLabelOf(sessionPath), add, null, onClosed).open();
}

export function openCoinEntry(app: App, store: CampaignStore, source: Source, openNote: () => void, onClosed: (changed: boolean) => void): void {
  const record = store.current.coins.find((coin) => coin.source.path === source.path && coin.source.line === source.line);
  if (record === undefined || !isLedgerLineEntry(record)) {
    openNote();
    return;
  }
  const editor = new NoteEditor(app.vault);
  const removal = entryRemoval(record);
  const save = async (line: string) => {
    if (line === `$ ${record.text}`) return false;
    const reading = readLedgerEntry(readMarker(line).body);
    let copper = 0;
    if (reading !== null && reading.type === "coin") copper = reading.copper;
    const refusal = refusalForEntryChange(store.sessionNotes, record, line, copper);
    if (refusal !== null) throw new Error(refusal);
    return editor.replace(record.source.path, [line], removal);
  };
  const remove = async () => {
    const refusal = refusalForEntryChange(store.sessionNotes, record, null, 0);
    if (refusal !== null) throw new Error(refusal);
    return editor.remove(removal);
  };
  const draft = draftOf(record.text, record.entry.copper, record.entry.coins);
  new CoinModal(app, sessionLabelOf(record.source.path), save, { draft, remove }, onClosed).open();
}
