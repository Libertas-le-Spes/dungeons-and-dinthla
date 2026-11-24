import { STUB_SPELLING } from "../../host/stub-spelling";
import { describe, expect, it, vi } from "vitest";
import { FencedNotes } from "../../../src/fence/notes/fenced-notes";
import type { WriteReport } from "../../../src/fence/notes/write-report";
import { Fence, OUTSIDE_FENCE } from "../../../src/fence/paths/fence";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { InMemoryNotes } from "../../host/in-memory-notes";
import { noteContract } from "../../host/note-contract";

const CONFIG = ".obsidian";
const SESSION = "D&D/Pale Moon/Sessions/Session 1.md";
const OUTSIDE = "Diary/Today.md";

function reportStub(): WriteReport {
  return { textSaved: vi.fn(), trashed: vi.fn(), renamed: vi.fn() };
}

function fencedOver(raw: InMemoryNotes, campaignsFolder: string | null = "D&D") {
  const report = reportStub();
  const notes = new FencedNotes(raw, new Fence(() => campaignsFolder, CONFIG, STUB_SPELLING), report);
  return { notes, report };
}

function contractHost() {
  const raw = new InMemoryNotes();
  const { notes } = fencedOver(raw);
  return { notes, put: (path: string, text: string) => raw.put(path, text) && notesNote(notes, path) };
}

function notesNote(notes: FencedNotes, path: string): NoteRef {
  const note = notes.store.note(path);
  if (note === null) throw new Error(`${path} isn't inside the fence.`);
  return note;
}

noteContract("The plugin's own fence over the in-memory host", contractHost);

describe("the plugin's own fence over a notes program", () => {
  it("finds no note outside the Campaigns folder, and lists none", () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    expect(notes.store.note(OUTSIDE)).toBeNull();
    expect(notes.store.notes().map((note) => note.path)).toEqual([SESSION]);
    expect(notes.store.files().map((note) => note.path)).toEqual([SESSION]);
  });

  it("refuses a handle it never handed out, though its path is inside, and reads nothing", async () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    const { notes } = fencedOver(raw);
    const forged = { path: SESSION, basename: "Session 1" };
    await expect(async () => notes.store.read(forged)).rejects.toThrow(OUTSIDE_FENCE);
    await expect(async () => notes.store.change(forged, (text) => text)).rejects.toThrow(OUTSIDE_FENCE);
    expect(raw.texts.get(SESSION)).toBe("? Who");
  });

  it("refuses a note it handed out once that note is no longer inside, as when the Campaigns folder changes", async () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    let folder: string | null = "D&D";
    const notes = new FencedNotes(raw, new Fence(() => folder, CONFIG, STUB_SPELLING), reportStub());
    const note = notesNote(notes, SESSION);
    folder = "Other";
    await expect(async () => notes.store.read(note)).rejects.toThrow(OUTSIDE_FENCE);
  });

  it("refuses a handle the raw program gave for a note outside, as it never hands one out", async () => {
    const raw = new InMemoryNotes();
    const outside = raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    await expect(async () => notes.store.read(outside)).rejects.toThrow(OUTSIDE_FENCE);
  });

  it.each([OUTSIDE, "D&D", "D&D/../Diary/Today.md", "D&D/Pale Moon/ Sessions.md", ".obsidian/plugins/x.md"])("makes nothing at %s, and writes nothing", async (path) => {
    const raw = new InMemoryNotes();
    const { notes } = fencedOver(raw);
    await expect(async () => notes.store.make(path, "text")).rejects.toThrow(OUTSIDE_FENCE);
    expect(raw.texts.size).toBe(0);
  });

  it("refuses to move a note out of the Campaigns folder, leaving it where it was", async () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    const { notes } = fencedOver(raw);
    const note = notesNote(notes, SESSION);
    await expect(async () => notes.store.move(note, OUTSIDE)).rejects.toThrow(OUTSIDE_FENCE);
    await expect(async () => notes.keeping.moveWithLinks(note, OUTSIDE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(note.path).toBe(SESSION);
  });

  it.each([null, ".obsidian", ".obsidian/D&D"])("lets nothing through with %j as the Campaigns folder", (folder) => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    raw.put(".obsidian/D&D/a.md", "x");
    const { notes } = fencedOver(raw, folder);
    expect(notes.store.notes()).toEqual([]);
    expect(notes.store.note(SESSION)).toBeNull();
  });

  it("reports each change, move and throw-away it lets through, once, and none it refuses", async () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "? Who");
    const { notes, report } = fencedOver(raw);
    const note = notesNote(notes, SESSION);
    await notes.store.change(note, (text) => `${text}!`);
    await notes.store.move(note, "D&D/Pale Moon/Sessions/Session 2.md");
    await notes.keeping.throwAway(note);
    await expect(async () => notes.store.move(note, OUTSIDE)).rejects.toThrow();
    expect(report.textSaved).toHaveBeenCalledExactlyOnceWith(SESSION, "? Who!");
    expect(report.renamed).toHaveBeenCalledExactlyOnceWith(SESSION, "D&D/Pale Moon/Sessions/Session 2.md");
    expect(report.trashed).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Sessions/Session 2.md");
  });

  it("tells only of notes inside, and of no move from or to outside", async () => {
    const raw = new InMemoryNotes();
    const inside = raw.put(SESSION, "? Who");
    const outside = raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    const heard: string[] = [];
    notes.changes.onChanged((note) => void heard.push(note.path));
    notes.changes.onMoved((note, oldPath) => void heard.push(`${oldPath} to ${note.path}`));
    notes.changes.onGone((path) => void heard.push(`gone ${path}`));
    await raw.change(outside, (text) => text);
    await raw.change(inside, (text) => text);
    await raw.move(inside, "Diary/Session 1.md");
    await raw.throwAway(outside);
    expect(heard).toEqual([SESSION]);
  });

  it("finds the Campaigns folder itself and folders inside it, but no folder outside", () => {
    const raw = new InMemoryNotes();
    for (const folder of ["D&D", "D&D/Pale Moon", "Diary"]) raw.folders.add(folder);
    const { notes } = fencedOver(raw);
    expect(notes.store.hasFolder("D&D")).toBe(true);
    expect(notes.store.hasFolder("D&D/Pale Moon")).toBe(true);
    expect(notes.store.hasFolder("Diary")).toBe(false);
  });

  it("names what is in the Campaigns folder itself and in folders inside it, but nothing outside", () => {
    const raw = new InMemoryNotes();
    raw.put("D&D/Pale Moon/Pale Moon.md", "");
    raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    expect(notes.store.namesIn("D&D")).toEqual(["Pale Moon"]);
    expect(notes.store.namesIn("D&D/Pale Moon")).toEqual(["Pale Moon.md"]);
    expect(notes.store.namesIn("Diary")).toEqual([]);
  });

  it("tells of a note read inside, with its text, and of none read outside", () => {
    const raw = new InMemoryNotes();
    const inside = raw.put(SESSION, "? Who");
    const outside = raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    const heard: string[] = [];
    notes.changes.onRead((note, text) => void heard.push(`${note.path}: ${text}`));
    raw.readBack(outside);
    raw.readBack(inside);
    expect(heard).toEqual([`${SESSION}: ? Who`]);
  });

  it("tells of a folder moved inside, and of no folder moved from or to outside", () => {
    const raw = new InMemoryNotes();
    const { notes } = fencedOver(raw);
    const heard: string[] = [];
    notes.changes.onFolderMoved((path, oldPath) => void heard.push(`${oldPath} to ${path}`));
    raw.moveFolder("D&D/Pale Moon", "D&D/Ashen Road");
    raw.moveFolder("D&D/Pale Moon", "Diary/Pale Moon");
    raw.moveFolder("Diary/Pale Moon", "D&D/Pale Moon");
    expect(heard).toEqual(["D&D/Pale Moon to D&D/Ashen Road"]);
  });

  it("tells of no move for a note brought in from outside", async () => {
    const raw = new InMemoryNotes();
    const outside = raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    const heard: string[] = [];
    notes.changes.onMoved((note) => void heard.push(note.path));
    await raw.move(outside, SESSION);
    expect(heard).toEqual([]);
  });

  it("finds a link's target only inside, and counts only links between notes inside", () => {
    const raw = new InMemoryNotes();
    raw.put(SESSION, "[[Today]]");
    raw.put(OUTSIDE, "Private.");
    const { notes } = fencedOver(raw);
    expect(notes.links.target("Today", SESSION)).toBeNull();
    expect(notes.links.target("Session 1", OUTSIDE)).toBeNull();
    expect(notes.links.target("Session 1", SESSION)?.path).toBe(SESSION);
  });
});
