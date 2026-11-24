import { vi } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import { sessionNoteOf } from "../../src/campaign/paths/session-file";
import { NoteDrafts } from "../../src/note-editing/note-drafts";
import { NoteSaver } from "../../src/note-editing/note-saver";
import type { AppendWriter } from "../../src/session-notes/drafts/append-writer";
import { Drafts } from "../../src/session-notes/drafts/drafts";
import { KeptDrafts } from "../../src/session-notes/kept/kept-drafts";
import { SessionClearer } from "../../src/session-notes/removal/session-clearer";
import { SessionTrash } from "../../src/session-notes/removal/session-trash";
import { SessionWriting } from "../../src/session-notes/page/session-writing";
import { writtenLinesOf } from "../../src/session-notes/lines/written-lines";
import type { ConfirmText } from "../../src/views/dialogs/confirm-modal";
import { FakeNotes } from "../note-editing/fake-notes";
import { stubRenumbering } from "./renumbering/stub-renumbering";
import { stubLineOpeners } from "./lines/stub-line-openers";
import { isShown, obsidianDocument } from "../stubs/obsidian-dom";
import { STUB_SYNTAX } from "../host/stub-syntax";

export const PATH = "Pale Moon/Sessions/Session 12.md";
export const NOTE = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the leter";
export const FIXED = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the letter";
export const HEADING = "Session 12 · The Old Mill";
export const KEPT_AT = new Date(2026, 10, 9, 21, 5).getTime();

interface Asked {
  text: ConfirmText;
  confirmed: () => void;
  kept: () => void;
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
  const confirm = vi.fn((confirmText: ConfirmText, confirmed: () => void, closed: () => void) => {
    const pressConfirm = () => {
      closed();
      confirmed();
    };
    asked.push({ text: confirmText, confirmed: pressConfirm, kept: closed });
  });
  const permanently = vi.fn(() => false);
  const renumbering = stubRenumbering();
  const report = vi.fn();
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
      lineOpeners: stubLineOpeners(),
      wholeText: { texts: notes.texts, drafts: noteDrafts, saver: new NoteSaver(notes.store) },
      removal: { clearer: new SessionClearer(notes.store, STUB_SYNTAX), trash: new SessionTrash(notes.store, { throwAway: trashFile }, permanently), renumbering, confirm, report },
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
    await session.editAllSettled();
  };
  const panels = () => [find(".dd-writing-panel"), find(".dd-lines-panel"), find(".dd-edit-all-panel")].map(isShown);
  const leaving = () => find(".dd-edit-all-leaving");
  const message = () => find(".dd-notes-message").textContent;
  const wholeMessage = () => find(".dd-edit-all-panel .dd-save-message").textContent;
  const reminder = () => find(".dd-writing-panel .dd-edit-all-reminder");
  const settle = session.editAllSettled.bind(session);
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
    permanently,
    renumbering,
    report,
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
