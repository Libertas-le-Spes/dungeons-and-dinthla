import { applySessionChange } from "../../campaign/changes/apply-session-change";
import { buildCampaign } from "../../campaign/reading/build-campaign";
import type { CoinRecord, SessionNote } from "../../campaign/record/campaign";
import { CHANGED_IN_NOTE, type Removal } from "../../campaign/writing/note-editor";
import type { Check, RecordChange } from "../../campaign/changes/record-change";
import { verdictOf, writeNothingWhen } from "../../campaign/changes/verdict";
import type { CoinLine, CoinReading } from "../../notes/writing/coin-lines";
import { coinSessionChange } from "./coin-session-change";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export const CHANGES_OTHER_MONEY = "That change would also change other money in the purse, so nothing was written.";

export interface EntryAsOpened {
  store: { readonly sessionNotes: SessionNote[] };
  record: CoinRecord;
  removal: Removal;
}

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, removal: Removal, coinLine: CoinLine | null, syntax: PropertiesSyntax): string | null {
  const after = applySessionChange(sessions, coinSessionChange(removal, coinLine), syntax);
  if (!after.linesAsRead) return CHANGED_IN_NOTE;
  let newCopper = 0;
  if (coinLine !== null) newCopper = coinLine.copper;
  const moved = buildCampaign(after.sessions).purseCopper - buildCampaign(sessions).purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_OTHER_MONEY;
  return null;
}

function entryChange(entry: EntryAsOpened, coinLine: CoinLine | null, checksFirst: Check<CoinLine | null>[], syntax: PropertiesSyntax): RecordChange<CoinLine | null> {
  return {
    plan: () => coinLine,
    checks: [...checksFirst, (plan) => verdictOf(refusalForEntryChange(entry.store.sessionNotes, entry.record, entry.removal, plan, syntax))],
    sessionChangeOf: (plan) => coinSessionChange(entry.removal, plan),
  };
}

export function coinSave(entry: EntryAsOpened, coinLine: CoinLine, cannotSave: string | null, opened: CoinReading, syntax: PropertiesSyntax): RecordChange<CoinLine | null> {
  const unchanged = () => writeNothingWhen("line" in opened && coinLine.line === opened.line);
  return entryChange(entry, coinLine, [() => verdictOf(cannotSave), unchanged], syntax);
}

export function coinDelete(entry: EntryAsOpened, syntax: PropertiesSyntax): RecordChange<CoinLine | null> {
  return entryChange(entry, null, [], syntax);
}
