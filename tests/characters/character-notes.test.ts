import { describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { characterNotesOf } from "../../src/characters/character-notes";

const CAMPAIGN_NOTE = "Pale Moon/Pale Moon.md";

function appWith(frontmatter: Record<string, unknown> | undefined, notes: string[] = ["Pale Moon/Characters/Thessaly.md"]): App {
  const caches: Record<string, { frontmatter?: Record<string, unknown> }> = {};
  if (frontmatter !== undefined) caches[CAMPAIGN_NOTE] = { frontmatter };
  return {
    vault: { cachedRead: async (file: TFile) => `text of ${file.path}` },
    metadataCache: {
      getCache: (path: string) => {
        const cache = caches[path];
        if (cache === undefined) return null;
        return cache;
      },
      getFirstLinkpathDest: (linktext: string) => {
        const path = notes.find((note) => note.endsWith(`/${linktext}.md`));
        if (path === undefined) return null;
        return { path } as TFile;
      },
    },
  } as unknown as App;
}

const THESSALY = { path: "Pale Moon/Characters/Thessaly.md" } as TFile;

describe("characterNotesOf", () => {
  it("reads a character's own note", async () => {
    expect(await characterNotesOf(appWith(undefined)).textOf(THESSALY)).toBe("text of Pale Moon/Characters/Thessaly.md");
  });

  it("finds the note a link points to, or none", () => {
    const notes = characterNotesOf(appWith(undefined));
    expect(notes.pathOfLink("Thessaly", "Pale Moon/Sessions/Session 1.md")).toBe("Pale Moon/Characters/Thessaly.md");
    expect(notes.pathOfLink("Nobody", "Pale Moon/Sessions/Session 1.md")).toBeNull();
  });

  it("knows the player's own character from the campaign note's character property", () => {
    const notes = characterNotesOf(appWith({ character: "[[Thessaly]]" }, ["Pale Moon/Characters/Thessaly.md", "Pale Moon/Characters/Mira.md"]));
    expect(notes.isOwnCharacter(THESSALY)).toBe(true);
    expect(notes.isOwnCharacter({ path: "Pale Moon/Characters/Mira.md" } as TFile)).toBe(false);
  });

  it("finds no own character without a campaign note, a character property, a link in it, or a note it points to", () => {
    expect(characterNotesOf(appWith(undefined)).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith({ role: "dm" })).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith({ character: ["[[Thessaly]]"] })).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith({ character: "Thessaly" })).isOwnCharacter(THESSALY)).toBe(false);
    expect(characterNotesOf(appWith({ character: "[[Thessaly]]" }, [])).isOwnCharacter(THESSALY)).toBe(false);
  });

});
