import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import type { CampaignStore } from "../../../src/campaign/reading/campaign-store";
import type { AppendWriter } from "../../../src/session-notes/drafts/append-writer";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { KeptDrafts } from "../../../src/session-notes/kept/kept-drafts";
import { SessionNotesPage } from "../../../src/session-notes/page/session-notes-page";
import { NoteDrafts } from "../../../src/note-editing/note-drafts";
import { NoteSaver } from "../../../src/note-editing/note-saver";
import { FakeNotes } from "../../note-editing/fake-notes";
import { SessionClearer } from "../../../src/session-notes/removal/session-clearer";
import { SessionTrash } from "../../../src/session-notes/removal/session-trash";
import type { ConfirmText } from "../../../src/views/dialogs/confirm-modal";
import type { SessionProperties } from "../../../src/sessions/session-properties";
import { isShown, obsidianDocument } from "../../views/obsidian-dom";

const FOLDER = "Pale Moon";
const DELETED_AT = new Date(2026, 10, 2, 21, 5).getTime();

function sessionOf(number: number, lines: string[], name = `Session ${number}`): SessionNote {
  return { path: `${FOLDER}/Sessions/${name}.md`, number, firstLine: 0, text: lines.join("\n") };
}

const TITLES: Record<string, SessionProperties> = {
  [`${FOLDER}/Sessions/Session 12.md`]: { title: "The Old Mill", played: "2026-11-09" },
  [`${FOLDER}/Sessions/Session 11.md`]: { title: "", played: "2026-11-02" },
};

function propertiesOf(path: string): SessionProperties {
  const properties = TITLES[path];
  if (properties === undefined) return { title: "", played: "" };
  return properties;
}

function pageWith(
  sessions: SessionNote[],
  asked: string | null,
  { folder = FOLDER as string | null, drafts = new Drafts({}, () => {}), notes = new FakeNotes(`${FOLDER}/Sessions/Session 12.md`, "") } = {},
) {
  let listener = () => {};
  const unsubscribe = vi.fn();
  const store = {
    campaignFolder: folder,
    sessionNotes: sessions,
    current: buildCampaign(sessions),
    subscribe: (next: () => void) => {
      listener = next;
      return unsubscribe;
    },
  };
  const change = (next: SessionNote[]) => {
    store.sessionNotes = next;
    store.current = buildCampaign(next);
    listener();
  };
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const moves = { showSession: vi.fn(), showNoSession: vi.fn(), startSession: vi.fn(), stayOn: vi.fn() };
  const confirm = vi.fn((_text: ConfirmText, confirmed: () => void, closed: () => void) => {
    closed();
    confirmed();
  });
  const trashFile = vi.fn(async () => {});
  const writer = { save: vi.fn(async () => "") };
  const keptDrafts = new KeptDrafts(drafts, () => DELETED_AT);
  const needs = {
    store: store as unknown as CampaignStore,
    drafts,
    keptDrafts,
    writer: writer as unknown as AppendWriter,
    propertiesOf,
    openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    wholeText: { texts: notes.texts, drafts: new NoteDrafts(drafts), saver: new NoteSaver(notes.vault) },
    removal: { clearer: new SessionClearer(notes.vault), trash: new SessionTrash(notes.vault, { trashFile }, () => false), confirm },
  };
  const page = new SessionNotesPage(root, asked, needs, moves);
  page.load();
  const select = () => root.querySelector("select")!;
  const lineTexts = () => Array.from(root.querySelectorAll(".dd-written-line .dd-line-text")).map((line) => line.textContent);
  return { root, page, moves, writer, change, unsubscribe, select, lineTexts, drafts, keptDrafts, confirm, trashFile };
}

const SESSIONS = [
  sessionOf(11, ["? Who sent the letter"]),
  sessionOf(12, ["Tracks lead to the [[Old Mill]].", "! Find the caravan"]),
  sessionOf(3, []),
];

describe("SessionNotesPage", () => {
  it("heads the page with the session shown, and lists the sessions newest first to switch between", () => {
    const { root, select } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 11");
    expect(select().getAttribute("aria-label")).toBe("Session");
    expect(Array.from(select().options).map((option) => option.textContent)).toEqual([
      "Session 12 · The Old Mill · 9 Nov 2026",
      "Session 11 · 2 Nov 2026",
      "Session 3",
    ]);
    expect(select().value).toBe(`${FOLDER}/Sessions/Session 11.md`);
  });

  it("shows the latest session when none is asked for", () => {
    const { root, select, lineTexts } = pageWith(SESSIONS, null);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 12 · The Old Mill");
    expect(select().value).toBe(`${FOLDER}/Sessions/Session 12.md`);
    expect(lineTexts()).toEqual(["Find the caravan", "Tracks lead to the [[Old Mill]]."]);
  });

  it("asks the tab to show another session when one is chosen", () => {
    const { select, moves } = pageWith(SESSIONS, null);
    const picker = select();
    picker.value = `${FOLDER}/Sessions/Session 3.md`;
    picker.dispatchEvent(new picker.ownerDocument.defaultView!.Event("change"));
    expect(moves.showSession).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 3.md`);
  });

  it("starts a new session from its button", () => {
    const { root, moves } = pageWith(SESSIONS, null);
    const button = Array.from(root.querySelectorAll("button")).find((candidate) => candidate.textContent === "New session")!;
    button.click();
    expect(moves.startSession).toHaveBeenCalledOnce();
  });

  it("puts the box in front, holding this session's draft, and saves into this session", async () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(`${FOLDER}/Sessions/Session 11.md`, "? Why does the wheel turn");
    const { root, writer } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`, { drafts });
    const box = root.querySelector("textarea")!;
    expect(box.value).toBe("? Why does the wheel turn");
    expect(root.ownerDocument.activeElement).toBe(box);
    root.querySelector<HTMLButtonElement>(".dd-save")!.click();
    await vi.waitFor(() => expect(writer.save).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 11.md`, "? Why does the wheel turn"));
  });

  it("redraws the lines when the session note changes, keeping the box as typed", () => {
    const { root, change, lineTexts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    const box = root.querySelector("textarea")!;
    box.value = "! Ride to Thessaly";
    change([sessionOf(11, ["? Who sent the letter", "?= Who sent the letter: Lady Vess"]), SESSIONS[1]!]);
    expect(lineTexts()).toEqual(["Who sent the letter: Lady Vess", "Who sent the letter"]);
    expect(root.querySelector(".dd-line-state")?.textContent).toBe("✓");
    expect(root.querySelector("textarea")).toBe(box);
    expect(box.value).toBe("! Ride to Thessaly");
  });

  it("moves to the latest session once the campaign is read, when none was asked for", () => {
    const { root, change, lineTexts } = pageWith([], null);
    expect(root.querySelector("textarea")).toBeNull();
    expect(root.querySelector(".dd-empty")?.textContent).toBe("No sessions yet. Start one to write in it.");
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session notes");
    change(SESSIONS);
    expect(root.querySelector("textarea")).not.toBeNull();
    expect(lineTexts()).toEqual(["Find the caravan", "Tracks lead to the [[Old Mill]]."]);
  });

  it("says to rename one when two sessions share the latest number, still listing them", () => {
    const shared = [sessionOf(4, []), sessionOf(4, [], "Session 04")];
    const { root, select } = pageWith(shared, null);
    expect(root.querySelector("textarea")).toBeNull();
    expect(root.querySelector(".dd-empty")?.textContent).toBe("Session notes share the latest number, so it isn't clear which is read last. Rename one.");
    expect(select().options).toHaveLength(2);
  });

  it("stops listening to the campaign when closed", () => {
    const { page, unsubscribe } = pageWith(SESSIONS, null);
    page.unload();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("stays on the latest session it opened with when a newer one arrives, telling the tab", () => {
    const { root, change, moves } = pageWith(SESSIONS, null);
    const box = root.querySelector("textarea")!;
    box.value = "! Ride to Thessaly";
    expect(moves.stayOn).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 12.md`);
    change([...SESSIONS, sessionOf(13, [])]);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 12 · The Old Mill");
    expect(root.querySelector("textarea")).toBe(box);
    expect(box.value).toBe("! Ride to Thessaly");
    expect(moves.stayOn).toHaveBeenCalledOnce();
  });

  it("stays on the session it opened with when another takes the same latest number", () => {
    const { root, change } = pageWith(SESSIONS, null);
    const box = root.querySelector("textarea")!;
    change([...SESSIONS, sessionOf(12, [], "Session 012")]);
    expect(root.querySelector("textarea")).toBe(box);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 12 · The Old Mill");
  });

  it("tells the tab the latest session once the campaign is read, and nothing when a session was asked for", () => {
    const late = pageWith([], null);
    expect(late.moves.stayOn).not.toHaveBeenCalled();
    late.change(SESSIONS);
    expect(late.moves.stayOn).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 12.md`);
    const asked = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    expect(asked.moves.stayOn).not.toHaveBeenCalled();
  });

  it("stays on a session whose note is deleted, locks its box, keeps its typed lines below and says the note is gone", () => {
    const { root, change, lineTexts, keptDrafts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    const box = root.querySelector("textarea")!;
    box.value = "! Ride to Thessaly";
    box.dispatchEvent(new box.ownerDocument.defaultView!.Event("input"));
    keptDrafts.noteDeleted(`${FOLDER}/Sessions/Session 11.md`);
    change([SESSIONS[1]!, SESSIONS[2]!]);
    expect(root.querySelector("textarea")).toBe(box);
    expect(box.value).toBe("");
    expect(box.readOnly).toBe(true);
    expect(root.querySelector<HTMLButtonElement>(".dd-save")?.disabled).toBe(true);
    expect(root.querySelector(".dd-kept-text")?.textContent).toBe("! Ride to Thessaly");
    expect(root.querySelector<HTMLButtonElement>(".dd-kept-copy")?.disabled).toBe(true);
    expect(lineTexts()).toEqual(["Who sent the letter"]);
    expect(root.querySelector(".dd-notes-title")?.textContent).toBe("Session 11");
    expect(root.querySelector(".dd-note-gone")?.textContent).toBe(
      "This session's note was deleted, so nothing more can be saved to it. Lines typed in its box and not saved are kept below.",
    );
    change(SESSIONS);
    expect(root.querySelector(".dd-note-gone")?.textContent).toBe("");
    expect(box.readOnly).toBe(false);
  });

  it("shows lines kept from a deleted session, and copies them into the box of the session shown", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(`${FOLDER}/Sessions/Session 4.md`, "? Who rang the bell");
    drafts.keep(`${FOLDER}/Sessions/Session 12.md`, "Tracks lead north");
    const { root, keptDrafts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 12.md`, { drafts });
    const kept = root.querySelector<HTMLElement>(".dd-kept-lines")!;
    expect(isShown(kept)).toBe(false);
    keptDrafts.noteDeleted(`${FOLDER}/Sessions/Session 4.md`);
    expect(isShown(kept)).toBe(true);
    expect(kept.querySelector(".dd-kept-heading")?.textContent).toBe("Kept from deleted sessions");
    expect(kept.querySelector(".dd-kept-message")?.textContent).toBe(
      "Lines typed but not saved in Session 4 were kept when its note was deleted on 2 Nov 2026, 21:05.",
    );
    kept.querySelector<HTMLButtonElement>(".dd-kept-copy")!.click();
    expect(root.querySelector("textarea")?.value).toBe("Tracks lead north\n? Who rang the bell");
    expect(isShown(kept)).toBe(false);
    expect(keptDrafts.kept()).toEqual([]);
  });

  it("lists lines kept from deleted sessions and from an earlier version under their own headings", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(`${FOLDER}/Sessions/Session 4.md`, "? Who rang the bell");
    const { root, keptDrafts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 12.md`, { drafts });
    keptDrafts.keepMoved({ [`${FOLDER}/Sessions/Session 5.md`]: "! Find the bell" });
    keptDrafts.noteDeleted(`${FOLDER}/Sessions/Session 4.md`);
    const kept = root.querySelector<HTMLElement>(".dd-kept-lines")!;
    expect(Array.from(kept.querySelectorAll(".dd-kept-heading")).map((heading) => heading.textContent)).toEqual([
      "Kept from deleted sessions",
      "Kept from an earlier version",
    ]);
    expect(Array.from(kept.querySelectorAll(".dd-kept-message")).map((message) => message.textContent)).toEqual([
      "Lines typed but not saved in Session 4 were kept when its note was deleted on 2 Nov 2026, 21:05.",
      "Lines typed but not saved in Session 5 were kept in the plugin's settings file by an earlier version, and moved to this device on 2 Nov 2026, 21:05.",
    ]);
    expect(root.querySelector("textarea")?.value).toBe("");
  });

  it("discards lines kept from a deleted session only on a second press", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(`${FOLDER}/Sessions/Session 4.md`, "? Who rang the bell");
    const { root, keptDrafts } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 12.md`, { drafts });
    keptDrafts.noteDeleted(`${FOLDER}/Sessions/Session 4.md`);
    const discard = root.querySelector<HTMLButtonElement>(".dd-kept-discard")!;
    expect(discard.textContent).toBe("Discard");
    discard.click();
    expect(discard.textContent).toBe("Press again to discard");
    expect(keptDrafts.kept()).toHaveLength(1);
    discard.click();
    expect(keptDrafts.kept()).toEqual([]);
    expect(isShown(root.querySelector<HTMLElement>(".dd-kept-lines")!)).toBe(false);
  });

  it("can't copy kept lines while no session is shown", () => {
    const drafts = new Drafts({}, () => {});
    drafts.keep(`${FOLDER}/Sessions/Session 4.md`, "? Who rang the bell");
    const { root, keptDrafts } = pageWith([], null, { drafts, folder: null });
    keptDrafts.noteDeleted(`${FOLDER}/Sessions/Session 4.md`);
    const copy = root.querySelector<HTMLButtonElement>(".dd-kept-copy")!;
    expect(copy.disabled).toBe(true);
    copy.click();
    expect(keptDrafts.kept()).toHaveLength(1);
  });

  it("doesn't say a note is gone before the campaign is read", () => {
    const { root, change } = pageWith([], `${FOLDER}/Sessions/Session 11.md`);
    expect(root.querySelector(".dd-note-gone")?.textContent).toBe("");
    change(SESSIONS);
    expect(root.querySelector(".dd-note-gone")?.textContent).toBe("");
  });

  it("leaves the session list alone when the campaign changes without changing the sessions, so an open list stays open", () => {
    const { change, select } = pageWith(SESSIONS, `${FOLDER}/Sessions/Session 11.md`);
    const options = Array.from(select().options);
    change([sessionOf(11, ["? Who sent the letter", "Tracks"]), SESSIONS[1]!, SESSIONS[2]!]);
    for (const [index, option] of options.entries()) expect(select().options[index]).toBe(option);
    change([...SESSIONS, sessionOf(13, [])]);
    expect(select().options).toHaveLength(4);
    expect(select().value).toBe(`${FOLDER}/Sessions/Session 11.md`);
  });

  it("hides the session list while there are no sessions", () => {
    const { change, select } = pageWith([], null);
    expect(isShown(select())).toBe(false);
    change(SESSIONS);
    expect(isShown(select())).toBe(true);
  });

  it("opens Edit all on the session shown, and keeps its unsaved text when the page closes", async () => {
    const twelve = `${FOLDER}/Sessions/Session 12.md`;
    const notes = new FakeNotes(twelve, "Tracks lead to the [[Old Mill]].\n! Find the carvan");
    const { root, page, drafts } = pageWith(SESSIONS, twelve, { notes });
    root.querySelector<HTMLButtonElement>(".dd-edit-all")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLTextAreaElement>(".dd-edit-all-panel textarea")!.value).toBe("Tracks lead to the [[Old Mill]].\n! Find the carvan"));
    const box = root.querySelector<HTMLTextAreaElement>(".dd-edit-all-panel textarea")!;
    box.value = "Tracks lead to the [[Old Mill]].\n! Find the caravan";
    box.dispatchEvent(new box.ownerDocument.defaultView!.Event("input"));
    page.unload();
    expect(notes.changedListeners.size).toBe(0);
    expect(new NoteDrafts(drafts).draftOf(twelve)).toEqual({ base: "Tracks lead to the [[Old Mill]].\n! Find the carvan", text: "Tracks lead to the [[Old Mill]].\n! Find the caravan" });
  });

  it("asks before deleting the session shown, naming it, then shows the latest session left", async () => {
    const twelve = `${FOLDER}/Sessions/Session 12.md`;
    const notes = new FakeNotes(twelve, "Tracks lead to the [[Old Mill]].\n! Find the caravan");
    const { root, moves, confirm, trashFile } = pageWith(SESSIONS, twelve, { notes });
    root.querySelector<HTMLButtonElement>(".dd-delete-session")!.click();
    await vi.waitFor(() => expect(moves.showSession).toHaveBeenCalledExactlyOnceWith(`${FOLDER}/Sessions/Session 11.md`));
    expect(confirm.mock.calls[0]![0].title).toBe("Delete Session 12 · The Old Mill?");
    expect(trashFile).toHaveBeenCalledExactlyOnceWith({ path: twelve });
    expect(moves.showNoSession).not.toHaveBeenCalled();
  });

  it("says there are no sessions left after deleting the only one", async () => {
    const twelve = `${FOLDER}/Sessions/Session 12.md`;
    const notes = new FakeNotes(twelve, "Tracks");
    const { root, moves } = pageWith([SESSIONS[1]!], twelve, { notes });
    root.querySelector<HTMLButtonElement>(".dd-delete-session")!.click();
    await vi.waitFor(() => expect(moves.showNoSession).toHaveBeenCalledOnce());
    expect(moves.showSession).not.toHaveBeenCalled();
  });

  it("stops following the box's saves when closed", async () => {
    const drafts = new Drafts({}, () => {});
    const path = `${FOLDER}/Sessions/Session 11.md`;
    drafts.keep(path, "? Who");
    const { page, root } = pageWith(SESSIONS, path, { drafts });
    const box = root.querySelector("textarea")!;
    page.unload();
    let finish = (_left: string) => {};
    const saving = drafts.save(path, () => new Promise<string>((resolve) => (finish = resolve)));
    expect(box.readOnly).toBe(false);
    finish("");
    await saving;
    expect(box.value).toBe("? Who");
  });
});
