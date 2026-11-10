import { applySessionChange } from "../campaign/apply-session-change";
import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote, Source } from "../campaign/campaign";
import { CHANGED_IN_NOTE, removalAsRead, type EditorFiles, type Removal } from "../campaign/note-editor";
import { SessionChangeWriter } from "../campaign/session-change-writer";
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

export function coinEntryEdit(files: EditorFiles, store: { readonly sessionNotes: SessionNote[] }, record: CoinRecord): CoinEntryEdit {
  const writer = new SessionChangeWriter(files);
  const removal = removalAsRead(store.sessionNotes, record.source);
  const draft = draftOf(record.text, record.entry.copper, record.entry.coins);
  let cannotSave: string | null = CANNOT_SHOW;
  if (keepsTheEntry(record, draft)) cannotSave = null;
  const opened = readCoinDraft(draft);
  const change = async (coinLine: CoinLine | null) => {
    const refusal = refusalForEntryChange(store.sessionNotes, record, removal, coinLine);
    if (refusal !== null) throw new Error(refusal);
    return writer.apply(coinSessionChange(removal, coinLine));
  };
  return {
    draft,
    cannotSave,
    save: async (coinLine) => {
      if (cannotSave !== null) throw new Error(cannotSave);
      if ("line" in opened && coinLine.line === opened.line) return false;
      return change(coinLine);
    },
    delete: () => change(null),
  };
}
