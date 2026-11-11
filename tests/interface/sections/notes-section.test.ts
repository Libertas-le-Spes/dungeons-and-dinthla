import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/build-campaign";
import type { CampaignStore } from "../../../src/campaign/campaign-store";
import { notesSection } from "../../../src/interface/sections/notes-section";
import type { AppendWriter } from "../../../src/session-notes/drafts/append-writer";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { KeptDrafts } from "../../../src/session-notes/kept/kept-drafts";
import { SessionNotesPage } from "../../../src/session-notes/page/session-notes-page";
import type { NoteTexts } from "../../../src/campaign/note-texts";
import { NoteDrafts } from "../../../src/note-editing/note-drafts";
import type { NoteSaver } from "../../../src/note-editing/note-saver";
import type { SessionClearer } from "../../../src/session-notes/removal/session-clearer";
import type { SessionTrash } from "../../../src/session-notes/removal/session-trash";
import type { ConfirmText } from "../../../src/views/dialogs/confirm-modal";
import { obsidianDocument } from "../../views/obsidian-dom";

const ELEVEN = "Pale Moon/Sessions/Session 11.md";
const TWELVE = "Pale Moon/Sessions/Session 12.md";

const BOTH = [
  { path: ELEVEN, number: 11, firstLine: 0, text: "" },
  { path: TWELVE, number: 12, firstLine: 0, text: "" },
];

function made(path: string | null, sessions = BOTH) {
  const store = { campaignFolder: "Pale Moon", sessionNotes: sessions, current: buildCampaign(sessions), subscribe: () => () => {} };
  const startSession = vi.fn();
  const drafts = new Drafts({}, () => {});
  const texts = { read: vi.fn(async () => ""), onChanged: () => () => {}, onGone: () => () => {} };
  const trash = {
    ask: vi.fn(async (asked: string) => ({ file: { path: asked }, text: "" })),
    trash: vi.fn(async () => {}),
    deletesPermanently: () => false,
  };
  const confirm = (_text: ConfirmText, confirmed: () => void, closed: () => void) => {
    closed();
    confirmed();
  };
  const needs = {
    store: store as unknown as CampaignStore,
    drafts,
    keptDrafts: new KeptDrafts(drafts, () => 0),
    writer: {} as AppendWriter,
    propertiesOf: () => ({ title: "", played: "" }),
    openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    wholeText: { texts: texts as unknown as NoteTexts, drafts: new NoteDrafts(drafts), saver: {} as NoteSaver },
    removal: { clearer: {} as SessionClearer, trash: trash as unknown as SessionTrash, confirm },
    startSession,
  };
  const root = obsidianDocument().createElement("div");
  root.ownerDocument.body.append(root);
  const show = vi.fn();
  const stayOn = vi.fn();
  const page = notesSection(needs)(root, show, path, stayOn);
  page.load();
  return { root, page, show, startSession, stayOn, trash };
}

describe("notesSection", () => {
  it("makes the Notes page for the session the tab shows", () => {
    const { page, root } = made(ELEVEN);
    expect(page).toBeInstanceOf(SessionNotesPage);
    expect(root.querySelector("select")?.value).toBe(ELEVEN);
  });

  it("shows another session on the Notes page of the same tab", () => {
    const { root, show } = made(null);
    const select = root.querySelector("select")!;
    select.value = ELEVEN;
    select.dispatchEvent(new select.ownerDocument.defaultView!.Event("change"));
    expect(show).toHaveBeenCalledExactlyOnceWith({ page: "notes", path: ELEVEN });
  });

  it("starts a new session from the page's button", () => {
    const { root, startSession, show } = made(TWELVE);
    Array.from(root.querySelectorAll("button")).find((button) => button.textContent === "New session")!.click();
    expect(startSession).toHaveBeenCalledOnce();
    expect(show).not.toHaveBeenCalled();
  });

  it("shows the latest session left after deleting one, on the Notes page of the same tab", async () => {
    const { root, show, trash } = made(TWELVE);
    root.querySelector<HTMLButtonElement>(".dd-delete-session")!.click();
    await vi.waitFor(() => expect(show).toHaveBeenCalledExactlyOnceWith({ page: "notes", path: ELEVEN }));
    expect(trash.trash).toHaveBeenCalledExactlyOnceWith(TWELVE, { file: { path: TWELVE }, text: "" });
  });

  it("shows the Notes page with no session after deleting the last one", async () => {
    const { root, show } = made(TWELVE, [BOTH[1]!]);
    root.querySelector<HTMLButtonElement>(".dd-delete-session")!.click();
    await vi.waitFor(() => expect(show).toHaveBeenCalledExactlyOnceWith({ page: "notes", path: null }));
  });

  it("tells the tab which session the page settled on when none was asked for", () => {
    const { stayOn } = made(null);
    expect(stayOn).toHaveBeenCalledExactlyOnceWith(TWELVE);
  });
});
