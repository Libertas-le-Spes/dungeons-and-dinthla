import type { CoinRecord, SessionNote, Source } from "../../campaign/record/campaign";
import { removalAsRead, type EditorFiles } from "../../campaign/writing/note-editor";
import { SessionChangeWriter } from "../../campaign/changes/session-change-writer";
import { writeRecordChange } from "../../campaign/changes/write-record-change";
import { comparableLine, draftOf, readCoinDraft, type CoinDraft, type CoinLine } from "../../notes/writing/coin-lines";
import { coinDelete, coinSave } from "./coin-change";

export const CANNOT_SHOW = "The dialog can't show this entry as it is written, so it can only be deleted here. Change it in its note.";

export interface CoinEntryChoices {
  draft: CoinDraft;
  cannotSave: string | null;
  delete(): Promise<boolean>;
}

export interface CoinEntryEdit extends CoinEntryChoices {
  save(coinLine: CoinLine): Promise<boolean>;
}

export function entryToEdit(coins: CoinRecord[], source: Source): CoinRecord | null {
  const record = coins.find((coin) => coin.source.path === source.path && coin.source.line === source.line);
  if (record === undefined || record.isSale) return null;
  return record;
}

function keepsTheEntry(record: CoinRecord, draft: CoinDraft): boolean {
  const reading = readCoinDraft(draft);
  if ("error" in reading) return false;
  return comparableLine(reading.line) === comparableLine(`$ ${record.text}`);
}

export function coinEntryEdit(files: EditorFiles, store: { readonly sessionNotes: SessionNote[] }, record: CoinRecord): CoinEntryEdit {
  const writer = new SessionChangeWriter(files);
  const entry = { store, record, removal: removalAsRead(store.sessionNotes, record.source) };
  const draft = draftOf(record.text, record.entry.copper, record.entry.coins);
  let cannotSave: string | null = CANNOT_SHOW;
  if (keepsTheEntry(record, draft)) cannotSave = null;
  const opened = readCoinDraft(draft);
  return {
    draft,
    cannotSave,
    save: async (coinLine) => writeRecordChange(coinSave(entry, coinLine, cannotSave, opened), writer),
    delete: () => writeRecordChange(coinDelete(entry), writer),
  };
}
