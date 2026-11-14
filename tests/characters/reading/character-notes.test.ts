import { describe, expect, it } from "vitest";
import type { FrontmatterLinkCache, TFile } from "obsidian";
import { characterNotesOf } from "../../../src/characters/reading/character-notes";
import type { Gate } from "../../../src/fence/gate/gatekeeper";

const CAMPAIGN_NOTE = "Pale Moon/Pale Moon.md";
const THESSALY = { path: "Pale Moon/Characters/Thessaly.md" } as TFile;

interface Vault {
  links?: { key: string; link: string }[];
  hasCache?: boolean;
  notes?: string[];
  files?: string[];
}

function gateWith({ links, hasCache = true, notes = [THESSALY.path], files = [] }: Vault = {}) {
  const cachesAskedFor: unknown[] = [];
  const watchers: ((file: TFile) => void)[] = [];
  const stopped: unknown[] = [];
  const gate = {
    files: {
      getFileByPath: (path: string) => {
        if (path !== THESSALY.path) return null;
        return THESSALY;
      },
      cachedRead: async (file: TFile) => `text of ${file.path}`,
      getFiles: () => files.map((path) => ({ path }) as TFile),
      getMarkdownFiles: () => files.map((path) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1, -3) }) as TFile),
    },
    metadata: {
      getCache: (path: string) => {
        cachesAskedFor.push(path);
        if (!hasCache || path !== CAMPAIGN_NOTE) return null;
        return { frontmatterLinks: links as FrontmatterLinkCache[] | undefined };
      },
      getFirstLinkpathDest: (linktext: string) => {
        const path = notes.find((note) => note.endsWith(`/${linktext}.md`));
        if (path === undefined) return null;
        return { path } as TFile;
      },
      on: (name: string, watcher: (file: TFile) => void) => {
        if (name === "changed") watchers.push(watcher);
        return { watcher };
      },
      offref: (event: unknown) => stopped.push(event),
    },
  } as unknown as Gate;
  return { gate, cachesAskedFor, watchers, stopped };
}

const CAMPAIGNS = ["Ashen Road", "Pale Moon"];

function notesOf(gate: Gate) {
  return characterNotesOf(gate, () => CAMPAIGNS);
}

describe("characterNotesOf", () => {
  it("reads a character's own note", async () => {
    expect(await notesOf(gateWith().gate).textOf(THESSALY)).toBe("text of Pale Moon/Characters/Thessaly.md");
  });

  it("holds a note the fence lets through, and not a stand-in for it or a note it keeps out", () => {
    const notes = notesOf(gateWith().gate);
    expect(notes.holds(THESSALY)).toBe(true);
    expect(notes.holds({ path: THESSALY.path } as TFile)).toBe(false);
    expect(notes.holds({ path: "Private/Primary.md" } as TFile)).toBe(false);
  });

  it("finds the note a link points to, or none", () => {
    const notes = notesOf(gateWith().gate);
    expect(notes.pathOfLink("Thessaly", "Pale Moon/Sessions/Session 1.md")).toBe("Pale Moon/Characters/Thessaly.md");
    expect(notes.pathOfLink("Nobody", "Pale Moon/Sessions/Session 1.md")).toBeNull();
  });

  it("knows the player's own character from the campaign note's character property, not its other links", () => {
    const links = [
      { key: "party.0", link: "Mira" },
      { key: "character", link: "Thessaly" },
    ];
    const notes = notesOf(gateWith({ links, notes: [THESSALY.path, "Pale Moon/Characters/Mira.md"] }).gate);
    expect(notes.isOwnCharacter(THESSALY)).toBe(true);
    expect(notes.isOwnCharacter({ path: "Pale Moon/Characters/Mira.md" } as TFile)).toBe(false);
  });

  it("finds no own character without a campaign note, links in its properties, or a note the link points to", () => {
    const character = [{ key: "character", link: "Thessaly" }];
    expect(notesOf(gateWith({ links: character, hasCache: false }).gate).isOwnCharacter(THESSALY)).toBe(false);
    expect(notesOf(gateWith().gate).isOwnCharacter(THESSALY)).toBe(false);
    expect(notesOf(gateWith({ links: character, notes: [] }).gate).isOwnCharacter(THESSALY)).toBe(false);
  });

  it("looks up no campaign note for a note outside every campaign", () => {
    const { gate, cachesAskedFor } = gateWith({ links: [{ key: "character", link: "Thessaly" }], notes: ["Thessaly.md"] });
    expect(notesOf(gate).isOwnCharacter({ path: "Thessaly.md" } as TFile)).toBe(false);
    expect(cachesAskedFor).toEqual([]);
  });

  it("gives the campaigns it was handed, and reads a campaign's sessions", async () => {
    const files = ["Pale Moon/Pale Moon.md", "Pale Moon/Sessions/Session 2.md", "Ashen Road/Ashen Road.md", "Ashen Road/Sessions/Session 1.md"];
    const notes = notesOf(gateWith({ files }).gate);
    expect(notes.campaignFolders()).toEqual(CAMPAIGNS);
    expect(await notes.sessionsOf("Pale Moon")).toEqual([{ path: "Pale Moon/Sessions/Session 2.md", number: 2, text: "text of Pale Moon/Sessions/Session 2.md", firstLine: 0 }]);
  });

  it("finds the notes in a campaign's Characters folder, by name", () => {
    const files = [
      "Pale Moon/Characters/Thessaly.md",
      "Pale Moon/Characters/Brother Aldric.md",
      "Pale Moon/Sessions/Session 1.md",
      "Ashen Road/Characters/Mira.md",
      "Pale Moon Characters/Kest.md",
    ];
    const found = notesOf(gateWith({ files }).gate).filesIn("Pale Moon");
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
    const notes = notesOf(gateWith({ files }).gate);
    expect(notes.filesIn("Pale Moon").map((file) => file.path)).toEqual(["Pale Moon/Characters/Thessaly.md"]);
    expect(notes.fallenFilesIn("Pale Moon").map((file) => file.path)).toEqual(["Pale Moon/Fallen/Brann.md", "Pale Moon/Fallen/Mira.md"]);
  });

  it("tells which note changed until it stops watching", () => {
    const { gate, watchers, stopped } = gateWith();
    const changed: string[] = [];
    const stop = notesOf(gate).onNoteChanged((path) => changed.push(path));
    watchers[0]!({ path: CAMPAIGN_NOTE } as TFile);
    stop();
    expect(changed).toEqual([CAMPAIGN_NOTE]);
    expect(stopped).toHaveLength(1);
  });
});
