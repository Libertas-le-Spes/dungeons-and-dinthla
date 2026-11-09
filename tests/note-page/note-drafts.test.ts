import { describe, expect, it, vi } from "vitest";
import { Drafts } from "../../src/session-notes/drafts";
import { NoteDrafts } from "../../src/note-page/note-drafts";

const OLD_MILL = "Pale Moon/Places/Old Mill.md";
const GILDED_STAG = "Pale Moon/Places/Gilded Stag.md";
const SESSION = "Pale Moon/Sessions/Session 3.md";

function noteDrafts() {
  const changed = vi.fn();
  const drafts = new Drafts({}, changed);
  return { drafts, notes: new NoteDrafts(drafts), changed };
}

describe("NoteDrafts", () => {
  it("keeps what was typed in a note's box with the text it was typed over", () => {
    const { notes } = noteDrafts();
    notes.keep(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns at night." });
    expect(notes.draftOf(OLD_MILL)).toEqual({ base: "The wheel turns.", text: "The wheel turns at night." });
    expect(notes.draftOf(GILDED_STAG)).toBeNull();
  });

  it("keeps nothing when the box holds the note as it was loaded", () => {
    const { notes, drafts } = noteDrafts();
    notes.keep(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns at night." });
    notes.keep(OLD_MILL, { base: "The wheel turns.", text: "The wheel turns." });
    expect(notes.draftOf(OLD_MILL)).toBeNull();
    expect(drafts.all()).toEqual({});
  });

  it("keeps a note's draft apart from a session's lines, even under the same path", () => {
    const { notes, drafts } = noteDrafts();
    drafts.keep(SESSION, "? Who sent the letter");
    notes.keep(SESSION, { base: "", text: "Recap" });
    expect(drafts.textOf(SESSION)).toBe("? Who sent the letter");
    expect(notes.draftOf(SESSION)).toEqual({ base: "", text: "Recap" });
  });

  it("owns the keys of notes' drafts, not a session's lines", () => {
    const { notes } = noteDrafts();
    expect(notes.owns(`note:${OLD_MILL}`)).toBe(true);
    expect(notes.owns(SESSION)).toBe(false);
  });

  it("reads nothing from a kept text it didn't write", () => {
    const { notes, drafts } = noteDrafts();
    drafts.keep(`note:${OLD_MILL}`, "not a draft");
    drafts.keep(`note:${GILDED_STAG}`, JSON.stringify({ base: 3, text: "Mira" }));
    expect(notes.draftOf(OLD_MILL)).toBeNull();
    expect(notes.draftOf(GILDED_STAG)).toBeNull();
  });

  it("follows a note when it is renamed", () => {
    const { notes } = noteDrafts();
    notes.keep(OLD_MILL, { base: "", text: "Lady Vess owns it." });
    notes.moved(OLD_MILL, GILDED_STAG);
    expect(notes.draftOf(GILDED_STAG)).toEqual({ base: "", text: "Lady Vess owns it." });
    expect(notes.draftOf(OLD_MILL)).toBeNull();
  });

  it("saves the kept draft through the writer and forgets it once written", async () => {
    const { notes } = noteDrafts();
    const draft = { base: "", text: "Lady Vess owns it." };
    notes.keep(OLD_MILL, draft);
    const write = vi.fn(async () => {});
    expect(await notes.save(OLD_MILL, write)).toBe(true);
    expect(write).toHaveBeenCalledExactlyOnceWith(OLD_MILL, draft);
    expect(notes.draftOf(OLD_MILL)).toBeNull();
  });

  it("keeps the draft when writing fails", async () => {
    const { notes } = noteDrafts();
    notes.keep(OLD_MILL, { base: "", text: "Lady Vess owns it." });
    await expect(notes.save(OLD_MILL, async () => Promise.reject(new Error("The note is gone.")))).rejects.toThrow("The note is gone.");
    expect(notes.draftOf(OLD_MILL)).toEqual({ base: "", text: "Lady Vess owns it." });
  });

  it("says when a note's draft changes and when its save starts and ends, by the note's path, and nothing for a session's", async () => {
    const { notes, drafts } = noteDrafts();
    const heard: string[] = [];
    const saving: boolean[] = [];
    notes.subscribe((path: string) => {
      heard.push(path);
      saving.push(notes.isSaving(path));
    });
    notes.keep(OLD_MILL, { base: "", text: "Lady Vess owns it." });
    drafts.keep(SESSION, "? Who");
    await notes.save(OLD_MILL, async () => {});
    await drafts.save(SESSION, async () => "");
    expect(heard).toEqual([OLD_MILL, OLD_MILL, OLD_MILL, OLD_MILL]);
    expect(saving).toEqual([false, true, true, false]);
  });
});
