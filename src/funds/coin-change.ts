import { applySessionChange } from "../campaign/apply-session-change";
import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, type Removal } from "../campaign/note-editor";
import type { Check, RecordChange } from "../campaign/record-change";
import { verdictOf, writeNothingWhen } from "../campaign/verdict";
import type { CoinLine, CoinReading } from "../notes/coin-lines";
import { coinSessionChange } from "./coin-session-change";

export const CHANGES_OTHER_MONEY = "That change would also change other money in the purse, so nothing was written.";

export interface OpenedEntry {
  store: { readonly sessionNotes: SessionNote[] };
  record: CoinRecord;
  removal: Removal;
}

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, removal: Removal, coinLine: CoinLine | null): string | null {
  const after = applySessionChange(sessions, coinSessionChange(removal, coinLine));
  if (!after.linesAsRead) return CHANGED_IN_NOTE;
  let newCopper = 0;
  if (coinLine !== null) newCopper = coinLine.copper;
  const moved = buildCampaign(after.sessions).purseCopper - buildCampaign(sessions).purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_OTHER_MONEY;
  return null;
}

function entryChange(entry: OpenedEntry, coinLine: CoinLine | null, checksFirst: Check<CoinLine | null>[]): RecordChange<CoinLine | null> {
  return {
    plan: () => coinLine,
    checks: [...checksFirst, (plan) => verdictOf(refusalForEntryChange(entry.store.sessionNotes, entry.record, entry.removal, plan))],
    sessionChangeOf: (plan) => coinSessionChange(entry.removal, plan),
  };
}

export function coinSave(entry: OpenedEntry, coinLine: CoinLine, cannotSave: string | null, opened: CoinReading): RecordChange<CoinLine | null> {
  const unchanged = () => writeNothingWhen("line" in opened && coinLine.line === opened.line);
  return entryChange(entry, coinLine, [() => verdictOf(cannotSave), unchanged]);
}

export function coinDelete(entry: OpenedEntry): RecordChange<CoinLine | null> {
  return entryChange(entry, null, []);
}
