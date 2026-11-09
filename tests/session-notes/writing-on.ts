import { expect, vi } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { NoteDrafts } from "../../src/note-editing/note-drafts";
import { NoteSaver } from "../../src/note-editing/note-saver";
import type { AppendWriter } from "../../src/session-notes/append-writer";
import { Drafts } from "../../src/session-notes/drafts";
import { KeptDrafts } from "../../src/session-notes/kept-drafts";
import { SessionClearer } from "../../src/session-notes/session-clearer";
import { SessionTrash } from "../../src/session-notes/session-trash";
import { SessionWriting } from "../../src/session-notes/session-writing";
import { writtenLinesOf } from "../../src/session-notes/written-lines";
import type { ConfirmText } from "../../src/views/confirm-modal";
import { FakeNotes } from "../note-editing/fake-notes";
import { isShown, obsidianDocument } from "../views/obsidian-dom";

export const PATH = "Pale Moon/Sessions/Session 12.md";
export const NOTE = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the leter";
export const FIXED = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the letter";
export const HEADING = "Session 12 · The Old Mill";
export const KEPT_AT = new Date(2026, 10, 9, 21, 5).getTime();

export function flushed(): Promise<void> {
  return new Promise((done) => setTimeout(done, 0));
}

interface Asked {
  text: ConfirmText;
  confirmed: () => void;
}

export function writingOn(text: string | null, drafts = new Drafts({}, () => {})) {
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const notes = new FakeNotes(PATH, text);
  const noteDrafts = new NoteDrafts(drafts);
  const keptDrafts = new KeptDrafts(drafts, () => KEPT_AT);
  const writer = { save: vi.fn(async () => "") };
  const trashFile = vi.fn(async (_file: TFile) => {
    notes.text = null;
  });
  const asked: Asked[] = [];
  const confirm = vi.fn((confirmText: ConfirmText, confirmed: () => void) => {
    asked.push({ text: confirmText, confirmed });
  });
  const moves = { heading: vi.fn(() => HEADING), deleted: vi.fn() };
  const session = new SessionWriting(
    root,
    PATH,
    {
      drafts,
      keptDrafts,
      writer: writer as unknown as AppendWriter,
      openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
      campaign: () => buildCampaign([]),
      actions: { openRow: vi.fn(), openLink: vi.fn() },
      wholeText: { texts: notes.texts, drafts: noteDrafts, saver: new NoteSaver(notes.vault) },
      removal: { clearer: new SessionClearer(notes.vault), trash: new SessionTrash(notes.vault, { trashFile }), confirm },
    },
    moves,
  );
  const showNote = () => session.show(writtenLinesOf(sessionNoteOf(PATH, 12, String(notes.text))), buildCampaign([]));
  const window = document.defaultView!;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const button = (selector: string) => find<HTMLButtonElement>(selector);
  const wholeBox = () => find<HTMLTextAreaElement>(".dd-edit-all-panel textarea");
  const typeWhole = (typed: string) => {
    wholeBox().value = typed;
    wholeBox().dispatchEvent(new window.Event("input"));
  };
  const typeLines = (typed: string) => {
    const box = find<HTMLTextAreaElement>(".dd-writing-panel textarea");
    box.value = typed;
    box.dispatchEvent(new window.Event("input"));
  };
  const editAll = async () => {
    button(".dd-edit-all").click();
    await flushed();
  };
  const panels = () => [find(".dd-writing-panel"), find(".dd-lines-panel"), find(".dd-edit-all-panel")].map(isShown);
  const leaving = () => find(".dd-edit-all-leaving");
  const message = () => find(".dd-notes-message").textContent;
  const wholeMessage = () => find(".dd-edit-all-panel .dd-save-message").textContent;
  const reminder = () => find(".dd-writing-panel .dd-edit-all-reminder");
  const settle = () => vi.waitFor(() => expect(noteDrafts.isSaving(PATH)).toBe(false));
  return {
    root,
    session,
    notes,
    drafts,
    noteDrafts,
    keptDrafts,
    writer,
    trashFile,
    confirm,
    asked,
    moves,
    showNote,
    button,
    wholeBox,
    typeWhole,
    typeLines,
    editAll,
    panels,
    leaving,
    message,
    wholeMessage,
    reminder,
    settle,
  };
}
