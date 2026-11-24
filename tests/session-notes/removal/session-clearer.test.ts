import { describe, expect, it } from "vitest";
import { CHANGED_SINCE_ASKED, clearedText, PROPERTIES_NOT_FOUND, SESSION_GONE, SessionClearer } from "../../../src/session-notes/removal/session-clearer";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { BOM, FakeNotes } from "../../note-editing/fake-notes";

const PATH = "Pale Moon/Sessions/Session 12.md";

describe("clearedText", () => {
  it("keeps the properties block exactly and drops every line below it", () => {
    expect(clearedText("---\nplayed: 2026-11-09\ntitle: The Old Mill\n---\nTracks\n? Who", STUB_SYNTAX)).toBe("---\nplayed: 2026-11-09\ntitle: The Old Mill\n---\n");
  });

  it("keeps Windows line endings and a byte order mark in the properties", () => {
    expect(clearedText(`${BOM}---\r\nplayed: 2026-11-09\r\n---\r\nTracks\r\n`, STUB_SYNTAX)).toBe(`${BOM}---\r\nplayed: 2026-11-09\r\n---\r\n`);
  });

  it("leaves nothing of a note with no properties, but its byte order mark", () => {
    expect(clearedText("Tracks\n? Who", STUB_SYNTAX)).toBe("");
    expect(clearedText(`${BOM}Tracks`, STUB_SYNTAX)).toBe(BOM);
  });
});

describe("SessionClearer", () => {
  it("clears the note in one change when it is as it was when asked", async () => {
    const notes = new FakeNotes(PATH, "---\nplayed: 2026-11-09\n---\nTracks");
    await new SessionClearer(notes.store, STUB_SYNTAX).clear(PATH, "---\nplayed: 2026-11-09\n---\nTracks");
    expect(notes.process).toHaveBeenCalledOnce();
    expect(notes.writes).toEqual(["---\nplayed: 2026-11-09\n---\n"]);
  });

  it("compares with the note as the box reads it, so Windows line endings and a mark still count as unchanged", async () => {
    const notes = new FakeNotes(PATH, `${BOM}Tracks\r\n? Who`);
    await new SessionClearer(notes.store, STUB_SYNTAX).clear(PATH, "Tracks\n? Who");
    expect(notes.writes).toEqual([BOM]);
  });

  it("writes nothing and says so when the note changed since it asked", async () => {
    const notes = new FakeNotes(PATH, "Tracks\n! Ride to Thessaly");
    await expect(new SessionClearer(notes.store, STUB_SYNTAX).clear(PATH, "Tracks")).rejects.toThrow(CHANGED_SINCE_ASKED);
    expect(notes.writes).toEqual([]);
  });

  it("says the note is gone without writing", async () => {
    const notes = new FakeNotes(PATH, null);
    await expect(new SessionClearer(notes.store, STUB_SYNTAX).clear(PATH, "Tracks")).rejects.toThrow(SESSION_GONE);
    expect(notes.process).not.toHaveBeenCalled();
  });

  it("writes nothing and says so when the note starts with --- but its properties block isn't closed", async () => {
    const notes = new FakeNotes(PATH, `${BOM}---\nplayed: 2026-11-09\nTracks`);
    await expect(new SessionClearer(notes.store, STUB_SYNTAX).clear(PATH, "---\nplayed: 2026-11-09\nTracks")).rejects.toThrow(PROPERTIES_NOT_FOUND);
    expect(notes.writes).toEqual([]);
  });
});
