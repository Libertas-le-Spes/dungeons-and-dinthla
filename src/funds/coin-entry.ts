import { applySessionChange } from "../campaign/apply-session-change";
import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote, Source } from "../campaign/campaign";
import { CHANGED_IN_NOTE, removalAsRead, type EditorFiles, type Removal } from "../campaign/note-editor";
import type { Check, RecordChange } from "../campaign/record-change";
import { SessionChangeWriter } from "../campaign/session-change-writer";
import { verdictOf, writeNothingWhen } from "../campaign/verdict";
import { writeRecordChange } from "../campaign/write-record-change";
import { comparableLine, draftOf, readCoinDraft, type CoinDraft, type CoinLine } from "../notes/coin-lines";
import { coinSessionChange } from "./coin-session-change";

export const CHANGES_OTHER_MONEY = "That change would also change other money in the purse, so nothing was written.";
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

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, removal: Removal, coinLine: CoinLine | null): string | null {
  const after = applySessionChange(sessions, coinSessionChange(removal, coinLine));
  if (!after.linesWhereRead) return CHANGED_IN_NOTE;
  let newCopper = 0;
  if (coinLine !== null) newCopper = coinLine.copper;
  const moved = buildCampaign(after.sessions).purseCopper - buildCampaign(sessions).purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_OTHER_MONEY;
  return null;
}

function keepsTheEntry(record: CoinRecord, draft: CoinDraft): boolean {
  const reading = readCoinDraft(draft);
  if ("error" in reading) return false;
  return comparableLine(reading.line) === comparableLine(`$ ${record.text}`);
}

interface OpenedEntry {
  store: { readonly sessionNotes: SessionNote[] };
  record: CoinRecord;
  removal: Removal;
}

interface CoinPlan {
  coinLine: CoinLine | null;
}

function entryChange(entry: OpenedEntry, coinLine: CoinLine | null, checksFirst: Check<CoinPlan>[], writer: SessionChangeWriter): RecordChange<CoinPlan> {
  return {
    plan: () => ({ coinLine }),
    checks: [...checksFirst, (plan) => verdictOf(refusalForEntryChange(entry.store.sessionNotes, entry.record, entry.removal, plan.coinLine))],
    writePlan: (plan) => writer.apply(coinSessionChange(entry.removal, plan.coinLine)),
  };
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
    save: async (coinLine) => {
      const unchanged = () => writeNothingWhen("line" in opened && coinLine.line === opened.line);
      return writeRecordChange(entryChange(entry, coinLine, [() => verdictOf(cannotSave), unchanged], writer));
    },
    delete: () => writeRecordChange(entryChange(entry, null, [], writer)),
  };
}
