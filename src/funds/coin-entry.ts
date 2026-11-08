import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote } from "../campaign/campaign";
import type { Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { readItemChange } from "../notes/item-change";
import { readLedgerEntry } from "../notes/ledger";
import { readMarker } from "../notes/marker";
import { appendLines, removeLines } from "../notes/note-lines";

export const CHANGES_MORE_THAN_THE_ENTRY = "That change would move the purse by more than this entry, so nothing was written.";

export function isLedgerLineEntry(record: CoinRecord): boolean {
  if (readItemChange(`$$ ${record.text}`) !== null) return false;
  const entry = readLedgerEntry(record.text);
  return entry !== null && entry.type === "coin";
}

export function entryRemoval(record: CoinRecord): Removal {
  return {
    path: record.source.path,
    line: record.source.line,
    matches: (written) => {
      const { marker, body } = readMarker(written);
      return marker === "ledger" && body === record.text;
    },
  };
}

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, newLine: string | null, newCopper: number): string | null {
  const removal = entryRemoval(record);
  const after = sessions.map((session) => {
    if (session.path !== record.source.path) return session;
    let text = removeLines(session.text, [removal]).text;
    if (newLine !== null) text = appendLines(text, [newLine]);
    return sessionNoteOf(session.path, session.number, text);
  });
  const before = buildCampaign(sessions);
  const changed = buildCampaign(after);
  const moved = changed.purseCopper - before.purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_MORE_THAN_THE_ENTRY;
  return null;
}
