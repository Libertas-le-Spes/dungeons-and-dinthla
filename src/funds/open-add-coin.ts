import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../campaign/campaign-folders";
import type { CampaignStore } from "../campaign/campaign-store";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { sessionLabelOf } from "../campaign/session-file";
import { sessionForDialog } from "../campaign/session-for-dialog";
import { writeRecordChange } from "../campaign/write-record-change";
import type { Source } from "../campaign/campaign";
import type { CoinLine } from "../notes/coin-lines";
import { newCoin } from "./new-coin-change";
import { coinEntryEdit, entryToEdit } from "./coin-entry";
import { CoinModal, type CoinOutcome } from "./coin-modal";
import type { Gate } from "../fence/gatekeeper";

const NO_SESSION = "Start a session first: coin is written into a session note.";

export function openAddCoin(app: App, gate: Gate, store: CampaignStore, onClosed: (outcome: CoinOutcome) => void, activePath: string | null): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    new Notice(NO_CAMPAIGN);
    return;
  }
  const wanted = { activePath, earliestSession: 0, noSession: NO_SESSION };
  const sessionPath = sessionForDialog(gate.files, folder, wanted);
  if (sessionPath === null) return;
  const writer = new SessionChangeWriter(gate.files);
  const add = (written: CoinLine) => writeRecordChange(newCoin(written, sessionPath), writer);
  new CoinModal(app, sessionLabelOf(sessionPath), add, null, null, onClosed).open();
}

export function openCoinEntry(app: App, gate: Gate, store: CampaignStore, source: Source, openNote: () => void, onClosed: (outcome: CoinOutcome) => void): void {
  const record = entryToEdit(store.current.coins, source);
  if (record === null) {
    openNote();
    return;
  }
  const edit = coinEntryEdit(gate.files, store, record);
  new CoinModal(app, sessionLabelOf(record.source.path), edit.save, edit, openNote, onClosed).open();
}
