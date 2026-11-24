import { NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { writeInSession } from "../../campaign/changes/write-in-session";
import { OpenedSession } from "../../campaign/paths/session-gone";
import type { Source } from "../../campaign/record/campaign";
import type { NoteStore } from "../../host/notes/note-store";
import type { CoinLine } from "../../notes/writing/coin-lines";
import type { DialogShowing } from "../../views/dialogs/dialog-view";
import { newCoin } from "./new-coin-change";
import { coinEntryEdit, entryToEdit } from "./coin-entry";
import { CoinDialog, type CoinOutcome } from "./coin-dialog";

const NO_SESSION = "Start a session first: coin is written into a session note.";

export type CoinNotes = Pick<NoteStore, "files" | "note" | "read" | "change">;

export function openAddCoin(
  showing: DialogShowing,
  notes: CoinNotes,
  store: CampaignStore,
  onClosed: (outcome: CoinOutcome) => void,
  activePath: string | null,
  syntax: PropertiesSyntax,
): void {
  const folder = store.campaignFolder;
  if (folder === null) {
    showing.telling.say(NO_CAMPAIGN);
    return;
  }
  const wanted = { activePath, earliestSession: 0, noSession: NO_SESSION };
  const sessionPath = sessionForDialog(notes, showing.telling, folder, wanted);
  if (sessionPath === null) return;
  const writer = new SessionChangeWriter(notes, syntax);
  const opened = new OpenedSession(notes, sessionPath);
  const add = (written: CoinLine) => writeInSession(opened, () => newCoin(store, written, sessionPath, syntax), writer);
  showing.dialogs.open(new CoinDialog(showing.telling, sessionLabelOf(sessionPath), add, null, null, onClosed));
}

export function openCoinEntry(
  showing: DialogShowing,
  notes: CoinNotes,
  store: CampaignStore,
  source: Source,
  openNote: () => void,
  onClosed: (outcome: CoinOutcome) => void,
  syntax: PropertiesSyntax,
): void {
  const record = entryToEdit(store.current.coins, source);
  if (record === null) {
    openNote();
    return;
  }
  const edit = coinEntryEdit(notes, store, record, syntax);
  showing.dialogs.open(new CoinDialog(showing.telling, sessionLabelOf(record.source.path), edit.save, edit, openNote, onClosed));
}
