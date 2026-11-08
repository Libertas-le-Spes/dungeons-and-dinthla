import { buildCampaign } from "../campaign/build-campaign";
import type { CoinRecord, SessionNote } from "../campaign/campaign";
import { CHANGED_IN_NOTE, NoteEditor, type EditorVault, type Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { draftOf, readCoinDraft, type CoinDraft, type CoinLine } from "../notes/coin-lines";
import { readItemChange } from "../notes/item-change";
import { dropLine, rewriteLine } from "../notes/note-lines";

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

export function isLedgerLineEntry(record: CoinRecord): boolean {
  return readItemChange(`$$ ${record.text}`) === null;
}

function sessionOf(sessions: SessionNote[], record: CoinRecord): SessionNote | undefined {
  return sessions.find((candidate) => candidate.path === record.source.path);
}

export function entryRemoval(sessions: SessionNote[], record: CoinRecord): Removal {
  const session = sessionOf(sessions, record);
  let read: string | undefined;
  if (session !== undefined) read = session.text.split("\n")[record.source.line];
  if (read !== undefined) read = read.replace(/\r$/, "");
  return { path: record.source.path, line: record.source.line, matches: (line) => line === read };
}

function changedText(text: string, removal: Removal, coinLine: CoinLine | null): string | null {
  if (coinLine === null) return dropLine(text, removal);
  return rewriteLine(text, removal, coinLine.line);
}

export function refusalForEntryChange(sessions: SessionNote[], record: CoinRecord, removal: Removal, coinLine: CoinLine | null): string | null {
  const session = sessionOf(sessions, record);
  if (session === undefined) return CHANGED_IN_NOTE;
  const text = changedText(session.text, removal, coinLine);
  if (text === null) return CHANGED_IN_NOTE;
  const after = sessions.map((candidate) => {
    if (candidate !== session) return candidate;
    return sessionNoteOf(session.path, session.number, text);
  });
  let newCopper = 0;
  if (coinLine !== null) newCopper = coinLine.copper;
  const moved = buildCampaign(after).purseCopper - buildCampaign(sessions).purseCopper;
  if (moved !== newCopper - record.entry.copper) return CHANGES_OTHER_MONEY;
  return null;
}

function comparable(line: string): string {
  return line.replace(/(\d),(?=\d{3})/g, "$1").replace(/\s+/g, " ").trim().toLowerCase();
}

function keepsTheEntry(record: CoinRecord, draft: CoinDraft): boolean {
  const reading = readCoinDraft(draft);
  if ("error" in reading) return false;
  return comparable(reading.line) === comparable(`$ ${record.text}`);
}

export function coinEntryEdit(vault: EditorVault, store: { readonly sessionNotes: SessionNote[] }, record: CoinRecord): CoinEntryEdit {
  const editor = new NoteEditor(vault);
  const removal = entryRemoval(store.sessionNotes, record);
  const draft = draftOf(record.text, record.entry.copper, record.entry.coins);
  let cannotSave: string | null = CANNOT_SHOW;
  if (keepsTheEntry(record, draft)) cannotSave = null;
  const opened = readCoinDraft(draft);
  const change = async (coinLine: CoinLine | null, write: () => Promise<boolean>) => {
    const refusal = refusalForEntryChange(store.sessionNotes, record, removal, coinLine);
    if (refusal !== null) throw new Error(refusal);
    return write();
  };
  return {
    draft,
    cannotSave,
    save: async (coinLine) => {
      if (cannotSave !== null) throw new Error(cannotSave);
      if ("line" in opened && coinLine.line === opened.line) return false;
      return change(coinLine, () => editor.rewrite(removal, coinLine.line));
    },
    delete: () => change(null, () => editor.drop(removal)),
  };
}
