import { Notice, type App } from "obsidian";
import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import type { Source } from "../../campaign/record/campaign";
import type { CoinLine } from "../../notes/writing/coin-lines";
import { newCoin } from "./new-coin-change";
import { coinEntryEdit, entryToEdit } from "./coin-entry";
import { CoinModal, type CoinOutcome } from "./coin-modal";
import type { Gate } from "../../fence/gate/gatekeeper";

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
  const opened = new OpenedSession(gate.files, sessionPath);
  const add = (written: CoinLine) => writeInSession(opened, () => newCoin(written, sessionPath), writer);
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
