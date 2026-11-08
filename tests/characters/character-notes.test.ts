import { describe, expect, it } from "vitest";
import type { App, FrontmatterLinkCache, TFile } from "obsidian";
import { characterNotesOf } from "../../src/characters/character-notes";

const CAMPAIGN_NOTE = "Pale Moon/Pale Moon.md";
const THESSALY = { path: "Pale Moon/Characters/Thessaly.md" } as TFile;

interface Vault {
  links?: { key: string; link: string }[];
  hasCache?: boolean;
  notes?: string[];
  files?: string[];
}

function appWith({ links, hasCache = true, notes = [THESSALY.path], files = [] }: Vault = {}) {
  const cachesAskedFor: unknown[] = [];
  const watchers: ((file: TFile) => void)[] = [];
  const stopped: unknown[] = [];
  const app = {
    vault: {
      cachedRead: async (file: TFile) => `text of ${file.path}`,
      getFiles: () => files.map((path) => ({ path }) as TFile),
      getMarkdownFiles: () => files.map((path) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1, -3) }) as TFile),
    },
    metadataCache: {
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
  } as unknown as App;
  return { app, cachesAskedFor, watchers, stopped };
}

describe("characterNotesOf", () => {
  it("reads a character's own note", async () => {
    expect(await characterNotesOf(appWith().app).textOf(THESSALY)).toBe("text of Pale Moon/Characters/Thessaly.md");
  });

  it("finds the note a link points to, or none", () => {
    const notes = characterNotesOf(appWith().app);
    expect(notes.pathOfLink("Thessaly", "Pale Moon/Sessions/Session 1.md")).toBe("Pale Moon/Characters/Thessaly.md");
    expect(notes.pathOfLink("Nobody", "Pale Moon/Sessions/Session 1.md")).toBeNull();
  });

  it("knows the player's own character from the campaign note's character property, not its other links", () => {
    const links = [
      { key: "party.0", link: "Mira" },
      { key: "character", link: "Thessaly" },
    ];
    const notes = characterNotesOf(appWith({ links, notes: [THESSALY.path, "Pale Moon/Characters/Mira.md"] }).app);
    expect(notes.isOwnCharacter(THESSALY)).toBe(true);
    expect(notes.isOwnCharacter({ path: "Pale Moon/Characters/Mira.md" } as TFile)).toBe(false);
  });

  it("finds no own character without a campaign note, links in its properties, or a note the link points to", () => {
    const character = [{ key: "character", link: "Thessaly" }];
    expect(characterNotesOf(appWith({ links: character, hasCache: false }).app).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith().app).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith({ links: character, notes: [] }).app).isOwnCharacter(THESSALY)).toBe(false);
  });

  it("looks up no campaign note for a note outside any folder", () => {
    const { app, cachesAskedFor } = appWith({ links: [{ key: "character", link: "Thessaly" }], notes: ["Thessaly.md"] });
    expect(characterNotesOf(app).isOwnCharacter({ path: "Thessaly.md" } as TFile)).toBe(false);
    expect(cachesAskedFor).toEqual([]);
  });

  it("finds the campaigns and reads a campaign's sessions", async () => {
    const files = ["Pale Moon/Pale Moon.md", "Pale Moon/Sessions/Session 2.md", "Ashen Road/Ashen Road.md", "Ashen Road/Sessions/Session 1.md"];
    const notes = characterNotesOf(appWith({ files }).app);
    expect(notes.campaignFolders()).toEqual(["Ashen Road", "Pale Moon"]);
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
    const found = characterNotesOf(appWith({ files }).app).filesIn("Pale Moon");
    expect(found.map((file) => file.path)).toEqual(["Pale Moon/Characters/Brother Aldric.md", "Pale Moon/Characters/Thessaly.md"]);
  });

  it("tells which note changed until it stops watching", () => {
    const { app, watchers, stopped } = appWith();
    const changed: string[] = [];
    const stop = characterNotesOf(app).onNoteChanged((path) => changed.push(path));
    watchers[0]!({ path: CAMPAIGN_NOTE } as TFile);
    stop();
    expect(changed).toEqual([CAMPAIGN_NOTE]);
    expect(stopped).toHaveLength(1);
  });
});
