import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { draftOf, readCoinDraft, type CoinDraft, type CoinLine } from "../notes/coin-lines";
import { readItemChange } from "../notes/item-change";
import { readLedgerEntry } from "../notes/ledger";
import { readMarker } from "../notes/marker";
import { removeLines, rewriteLine } from "../notes/note-lines";

export const CHANGES_OTHER_MONEY = "That change would also change other money in the purse, so nothing was written.";
export const CANNOT_SHOW = "The dialog can't show this entry as it is written, so it can only be deleted here. Change it in its note.";

const WRITTEN_LINK = /\[\[[^\]]*\]\]/g;

function linksIn(text: string): string {
  return Array.from(text.matchAll(WRITTEN_LINK), (match) => match[0]).join("\n");
}

export interface CoinEntryChoices {
  draft: CoinDraft;
  cannotSave: string | null;
  remove(): Promise<boolean>;
}

export interface CoinEntryEdit extends CoinEntryChoices {
  save(written: CoinLine): Promise<boolean>;
}

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

function changedText(text: string, removal: Removal, written: CoinLine | null): string | null {
  if (written === null) {
    const removed = removeLines(text, [removal]);
    if (removed.removed === 0) return null;
    return removed.text;
  }
  return rewriteLine(text, removal, written.line);
}

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, written: CoinLine | null): string | null {
  const session = sessions.find((candidate) => candidate.path === record.source.path);
  if (session === undefined) return CHANGED_IN_NOTE;
  const text = changedText(session.text, entryRemoval(record), written);
  if (text === null) return CHANGED_IN_NOTE;
  const after = sessions.map((candidate) => {
    if (candidate !== session) return candidate;
    return sessionNoteOf(session.path, session.number, text);
  });
  let newCopper = 0;
  if (written !== null) newCopper = written.copper;
  const moved = buildCampaign(after).purseCopper - buildCampaign(sessions).purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_OTHER_MONEY;
  return null;
}

function keepsTheEntry(record: CoinRecord, draft: CoinDraft): boolean {
  const reading = readCoinDraft(draft);
  if ("error" in reading || reading.copper !== record.entry.copper) return false;
  return linksIn(record.text) === linksIn(draft.what);
}

export function coinEntryEdit(vault: EditorVault, store: { readonly sessionNotes: SessionNote[] }, record: CoinRecord): CoinEntryEdit {
  const editor = new NoteEditor(vault);
  const removal = entryRemoval(record);
  const draft = draftOf(record.text, record.entry.copper, record.entry.coins);
  let cannotSave: string | null = CANNOT_SHOW;
  if (keepsTheEntry(record, draft)) cannotSave = null;
  const opened = readCoinDraft(draft);
  const change = async (written: CoinLine | null, write: () => Promise<boolean>) => {
    const refusal = refusalForEntryChange(store.sessionNotes, record, written);
    if (refusal !== null) throw new Error(refusal);
    return write();
  };
  return {
    draft,
    cannotSave,
    save: async (written) => {
      if (cannotSave !== null) throw new Error(cannotSave);
      if ("line" in opened && written.line === opened.line) return false;
      return change(written, () => editor.rewrite(removal, written.line));
    },
    remove: () => change(null, () => editor.remove(removal)),
  };
}
