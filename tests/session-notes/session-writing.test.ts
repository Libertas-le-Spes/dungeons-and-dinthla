import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { CHANGED_ELSEWHERE, NOTE_GONE_HERE } from "../../src/note-page/note-editing";
import { NoteDrafts } from "../../src/note-page/note-drafts";
import { NoteSaver } from "../../src/note-page/note-saver";
import type { AppendWriter } from "../../src/session-notes/append-writer";
import { Drafts } from "../../src/session-notes/drafts";
import { NOT_SAVED_YET } from "../../src/session-notes/edit-all-panel";
import { SessionWriting } from "../../src/session-notes/session-writing";
import { FakeNotes } from "../note-page/fake-notes";
import { isShown, obsidianDocument } from "../views/obsidian-dom";

const PATH = "Pale Moon/Sessions/Session 12.md";
const NOTE = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the leter";
const FIXED = "---\nplayed: 2026-11-09\n---\nTracks lead to the [[Old Mill]].\n? Who sent the letter";

function flushed(): Promise<void> {
  return new Promise((done) => setTimeout(done, 0));
}

function writingOn(text: string | null, drafts = new Drafts({}, () => {})) {
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  const notes = new FakeNotes(PATH, text);
  const noteDrafts = new NoteDrafts(drafts);
  const writer = { save: vi.fn(async () => "") };
  const session = new SessionWriting(root, PATH, {
    drafts,
    writer: writer as unknown as AppendWriter,
    openers: { question: vi.fn(), quest: vi.fn(), item: vi.fn() },
    campaign: () => buildCampaign([]),
    actions: { openRow: vi.fn(), openLink: vi.fn() },
    wholeText: { texts: notes.texts, drafts: noteDrafts, saver: new NoteSaver(notes.vault) },
  });
  const window = document.defaultView!;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const button = (selector: string) => find<HTMLButtonElement>(selector);
  const wholeBox = () => find<HTMLTextAreaElement>(".dd-edit-all-panel textarea");
  const typeWhole = (typed: string) => {
    wholeBox().value = typed;
    wholeBox().dispatchEvent(new window.Event("input"));
  };
  const editAll = async () => {
    button(".dd-edit-all").click();
    await flushed();
  };
  const panels = () => [find(".dd-writing-panel"), find(".dd-lines-panel"), find(".dd-edit-all-panel")].map(isShown);
  const leaving = () => find(".dd-edit-all-leaving");
  const settle = () => vi.waitFor(() => expect(noteDrafts.isSaving(PATH)).toBe(false));
  return { root, session, notes, noteDrafts, writer, button, wholeBox, typeWhole, editAll, panels, leaving, settle };
}

describe("SessionWriting", () => {
  it("adds lines with Edit all closed, and shows no whole-text box", () => {
    const { panels, root, notes } = writingOn(NOTE);
    expect(panels()).toEqual([true, true, false]);
    expect(root.querySelector(".dd-edit-all-panel textarea")).toBeNull();
    expect(notes.read).not.toHaveBeenCalled();
  });

  it("shows the session note's whole text, properties and all, in place of the add-lines box and the list on Edit all", async () => {
    const { editAll, panels, wholeBox, root } = writingOn(NOTE);
    await editAll();
    expect(panels()).toEqual([false, false, true]);
    expect(wholeBox().value).toBe(NOTE);
    expect(root.ownerDocument.activeElement).toBe(wholeBox());
  });

  it("writes the corrected text over the note in one change, keeping its Windows line endings", async () => {
    const { editAll, typeWhole, button, notes, settle, noteDrafts } = writingOn(NOTE.replaceAll("\n", "\r\n"));
    await editAll();
    typeWhole(FIXED);
    button(".dd-edit-all-panel .dd-save").click();
    await settle();
    expect(notes.process).toHaveBeenCalledOnce();
    expect(notes.writes).toEqual([FIXED.replaceAll("\n", "\r\n")]);
    expect(noteDrafts.draftOf(PATH)).toBeNull();
  });

  it("writes nothing over a change made to the note since Edit all loaded it, keeps what was typed and offers to load it again", async () => {
    const { editAll, typeWhole, button, notes, settle, noteDrafts, root } = writingOn(NOTE);
    await editAll();
    typeWhole(FIXED);
    notes.text = `${NOTE}\n! Ride to Thessaly`;
    button(".dd-edit-all-panel .dd-save").click();
    await settle();
    expect(notes.writes).toEqual([]);
    expect(noteDrafts.draftOf(PATH)).toEqual({ base: NOTE, text: FIXED });
    expect(root.querySelector(".dd-edit-all-panel .dd-save-message")!.textContent).toBe(CHANGED_ELSEWHERE);
    expect(isShown(button(".dd-edit-all-panel .dd-reload"))).toBe(true);
  });

  it("says the note is gone when it is deleted during Edit all, keeping what was typed", async () => {
    const { editAll, typeWhole, notes, wholeBox, root } = writingOn(NOTE);
    await editAll();
    typeWhole(FIXED);
    notes.deleteNote();
    expect(root.querySelector(".dd-edit-all-panel .dd-save-message")!.textContent).toBe(NOTE_GONE_HERE);
    expect(wholeBox().value).toBe(FIXED);
  });

  it("goes back to adding lines on Done when nothing is unsaved, with the add-lines box in front", async () => {
    const { editAll, button, panels, root, leaving } = writingOn(NOTE);
    await editAll();
    button(".dd-edit-all-done").click();
    expect(panels()).toEqual([true, true, false]);
    expect(isShown(leaving())).toBe(false);
    expect(root.ownerDocument.activeElement).toBe(root.querySelector(".dd-writing-panel textarea"));
    expect(root.querySelector(".dd-edit-all-panel textarea")).toBeNull();
  });

  it("won't leave silently with unsaved text: Done says so and offers to keep editing, which stays", async () => {
    const { editAll, typeWhole, button, panels, leaving, wholeBox, root } = writingOn(NOTE);
    await editAll();
    typeWhole(FIXED);
    button(".dd-edit-all-done").click();
    expect(panels()).toEqual([false, false, true]);
    expect(isShown(leaving())).toBe(true);
    expect(leaving().querySelector("p")!.textContent).toBe(NOT_SAVED_YET);
    expect(root.ownerDocument.activeElement).toBe(button(".dd-keep-editing"));
    button(".dd-keep-editing").click();
    expect(isShown(leaving())).toBe(false);
    expect(panels()).toEqual([false, false, true]);
    expect(wholeBox().value).toBe(FIXED);
    expect(root.ownerDocument.activeElement).toBe(wholeBox());
  });

  it("keeps unsaved text on this device when leaving anyway, marks Edit all as not saved, and shows the text again on Edit all", async () => {
    const { editAll, typeWhole, button, panels, noteDrafts, wholeBox, notes } = writingOn(NOTE);
    await editAll();
    typeWhole(FIXED);
    button(".dd-edit-all-done").click();
    button(".dd-leave-edit-all").click();
    expect(panels()).toEqual([true, true, false]);
    expect(noteDrafts.draftOf(PATH)).toEqual({ base: NOTE, text: FIXED });
    expect(button(".dd-edit-all").textContent).toBe("Edit all (not saved)");
    await editAll();
    expect(wholeBox().value).toBe(FIXED);
    expect(notes.writes).toEqual([]);
  });

  it("drops the leaving message once the text is saved", async () => {
    const { editAll, typeWhole, button, leaving, settle } = writingOn(NOTE);
    await editAll();
    typeWhole(FIXED);
    button(".dd-edit-all-done").click();
    button(".dd-edit-all-panel .dd-save").click();
    await settle();
    expect(isShown(leaving())).toBe(false);
    expect(button(".dd-edit-all").textContent).toBe("Edit all");
  });

  it("marks Edit all as not saved when it opens with text kept from before", () => {
    const drafts = new Drafts({}, () => {});
    new NoteDrafts(drafts).keep(PATH, { base: NOTE, text: FIXED });
    const { button } = writingOn(NOTE, drafts);
    expect(button(".dd-edit-all").textContent).toBe("Edit all (not saved)");
  });

  it("stops listening to the note and the drafts when closed", async () => {
    const drafts = new Drafts({}, () => {});
    const stops: ReturnType<typeof vi.fn>[] = [];
    const subscribe = drafts.subscribe.bind(drafts);
    vi.spyOn(drafts, "subscribe").mockImplementation((listener) => {
      const stop = vi.fn(subscribe(listener));
      stops.push(stop);
      return stop;
    });
    const { session, editAll, notes } = writingOn(NOTE, drafts);
    await editAll();
    expect(notes.changedListeners.size).toBe(1);
    session.close();
    expect(notes.changedListeners.size).toBe(0);
    expect(notes.goneListeners.size).toBe(0);
    expect(stops.length).toBe(3);
    for (const stop of stops) expect(stop).toHaveBeenCalledOnce();
  });
});
