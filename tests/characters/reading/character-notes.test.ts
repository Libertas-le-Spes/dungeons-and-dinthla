import { describe, expect, it, vi } from "vitest";
import { HostCharacterNotes, type SessionsReader } from "../../../src/characters/reading/character-notes";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { fileAt } from "../../stubs/note-files";

const CAMPAIGN_NOTE = "Pale Moon/Pale Moon.md";
const THESSALY = fileAt("Pale Moon/Characters/Thessaly.md");
const CAMPAIGN = fileAt(CAMPAIGN_NOTE);

interface Vault {
  links?: { key: string; linkText: string }[];
  hasCampaignNote?: boolean;
  notes?: string[];
  files?: string[];
}

function hostWith({ links = [], hasCampaignNote = true, notes = [THESSALY.path], files = [] }: Vault = {}) {
  const notesAskedFor: string[] = [];
  const watchers: ((note: NoteRef) => void)[] = [];
  const stop = vi.fn();
  const host = {
    store: {
      note: (path: string) => {
        notesAskedFor.push(path);
        if (path === THESSALY.path) return THESSALY;
        if (path === CAMPAIGN_NOTE && hasCampaignNote) return CAMPAIGN;
        return null;
      },
      notes: () => files.map((path) => fileAt(path)),
      readKept: async (file: NoteRef) => `text of ${file.path}`,
    },
    facts: {
      propertyLinksIn: (note: NoteRef) => {
        if (note !== CAMPAIGN) return [];
        return links;
      },
    },
    links: {
      target: (linkText: string) => {
        const path = notes.find((note) => note.endsWith(`/${linkText}.md`));
        if (path === undefined) return null;
        return fileAt(path);
      },
    },
    changes: {
      onRead: (heard: (note: NoteRef) => void) => {
        watchers.push(heard);
        return stop;
      },
    },
  };
  return { host, notesAskedFor, watchers, stop };
}

const CAMPAIGNS = ["Ashen Road", "Pale Moon"];

function notesOf(host: ReturnType<typeof hostWith>["host"], sessionsOf: SessionsReader = async () => []) {
  return new HostCharacterNotes({ notes: host, campaignFolders: () => CAMPAIGNS, sessionsOf });
}

describe("HostCharacterNotes", () => {
  it("reads a character's own note", async () => {
    expect(await notesOf(hostWith().host).textOf(THESSALY)).toBe("text of Pale Moon/Characters/Thessaly.md");
  });

  it("holds a note the store hands out, and not a stand-in for it or a note it keeps out", () => {
    const notes = notesOf(hostWith().host);
    expect(notes.holds(THESSALY)).toBe(true);
    expect(notes.holds(fileAt(THESSALY.path))).toBe(false);
    expect(notes.holds(fileAt("Private/Primary.md"))).toBe(false);
  });

  it("reads no stand-in for a note, though it shares the note's path", async () => {
    await expect(notesOf(hostWith().host).textOf(fileAt(THESSALY.path))).rejects.toThrow("Couldn't use Pale Moon/Characters/Thessaly.md");
  });

  it("finds the note a link points to, or none", () => {
    const notes = notesOf(hostWith().host);
    expect(notes.pathOfLink("Thessaly", "Pale Moon/Sessions/Session 1.md")).toBe("Pale Moon/Characters/Thessaly.md");
    expect(notes.pathOfLink("Nobody", "Pale Moon/Sessions/Session 1.md")).toBeNull();
  });

  it("knows the player's own character from the campaign note's character property, not its other links", () => {
    const links = [
      { key: "party.0", linkText: "Mira" },
      { key: "character", linkText: "Thessaly" },
    ];
    const notes = notesOf(hostWith({ links, notes: [THESSALY.path, "Pale Moon/Characters/Mira.md"] }).host);
    expect(notes.isOwnCharacter(THESSALY)).toBe(true);
    expect(notes.isOwnCharacter(fileAt("Pale Moon/Characters/Mira.md"))).toBe(false);
  });

  it("finds no own character without a campaign note, links in its properties, or a note the link points to", () => {
    const character = [{ key: "character", linkText: "Thessaly" }];
    expect(notesOf(hostWith({ links: character, hasCampaignNote: false }).host).isOwnCharacter(THESSALY)).toBe(false);
    expect(notesOf(hostWith().host).isOwnCharacter(THESSALY)).toBe(false);
    expect(notesOf(hostWith({ links: character, notes: [] }).host).isOwnCharacter(THESSALY)).toBe(false);
  });

  it("looks up no campaign note for a note outside every campaign", () => {
    const { host, notesAskedFor } = hostWith({ links: [{ key: "character", linkText: "Thessaly" }], notes: ["Thessaly.md"] });
    expect(notesOf(host).isOwnCharacter(fileAt("Thessaly.md"))).toBe(false);
    expect(notesAskedFor).toEqual([]);
  });

  it("gives the campaigns it was handed, and reads a campaign's sessions with the reader it was handed", async () => {
    const sessions = [{ path: "Pale Moon/Sessions/Session 2.md", number: 2, text: "One", firstLine: 0 }];
    const sessionsOf = vi.fn(async () => sessions);
    const notes = notesOf(hostWith().host, sessionsOf);
    expect(notes.campaignFolders()).toEqual(CAMPAIGNS);
    expect(await notes.sessionsOf("Pale Moon")).toBe(sessions);
    expect(sessionsOf).toHaveBeenCalledExactlyOnceWith("Pale Moon");
  });

  it("finds the notes in a campaign's Characters folder, by name", () => {
    const files = [
      "Pale Moon/Characters/Thessaly.md",
      "Pale Moon/Characters/Brother Aldric.md",
      "Pale Moon/Sessions/Session 1.md",
      "Ashen Road/Characters/Mira.md",
      "Pale Moon Characters/Kest.md",
    ];
    const found = notesOf(hostWith({ files }).host).filesIn("Pale Moon");
    expect(found.map((file) => file.path)).toEqual(["Pale Moon/Characters/Brother Aldric.md", "Pale Moon/Characters/Thessaly.md"]);
  });

  it("leaves the notes in Fallen out of the Characters list, and finds them in their own, by name", () => {
    const files = [
      "Pale Moon/Characters/Thessaly.md",
      "Pale Moon/Fallen/Mira.md",
      "Pale Moon/Fallen/Brann.md",
      "Ashen Road/Fallen/Kest.md",
      "Pale Moon Fallen/Vess.md",
    ];
    const notes = notesOf(hostWith({ files }).host);
    expect(notes.filesIn("Pale Moon").map((file) => file.path)).toEqual(["Pale Moon/Characters/Thessaly.md"]);
    expect(notes.fallenFilesIn("Pale Moon").map((file) => file.path)).toEqual(["Pale Moon/Fallen/Brann.md", "Pale Moon/Fallen/Mira.md"]);
  });

  it("tells which note changed, and hands back the store's own stop", () => {
    const { host, watchers, stop } = hostWith();
    const changed: string[] = [];
    const stopWatching = notesOf(host).onNoteChanged((path) => changed.push(path));
    watchers[0]!(CAMPAIGN);
    expect(changed).toEqual([CAMPAIGN_NOTE]);
    expect(stopWatching).toBe(stop);
  });
});
