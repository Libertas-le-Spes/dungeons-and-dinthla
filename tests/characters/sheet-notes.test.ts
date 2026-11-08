import { describe, expect, it } from "vitest";
import type { App, CachedMetadata, TFile } from "obsidian";
import { carriedGroupsOf, sheetNotesOf } from "../../src/characters/sheet-notes";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const OLD_MIRA = "Ashen Road/Characters/Mira.md";

function appWith(cache: CachedMetadata | null, notes: string[] = [OLD_MIRA, MIRA.path]) {
  return {
    vault: {
      getFileByPath: (path: string) => {
        if (!notes.includes(path)) return null;
        return { path } as TFile;
      },
    },
    metadataCache: {
      getFileCache: () => cache,
      getFirstLinkpathDest: (linktext: string) => {
        const path = notes.find((note) => note === `${linktext}.md`);
        if (path === undefined) return null;
        return { path } as TFile;
      },
    },
  } as unknown as App;
}

function carriedFrom(link: string, carried?: unknown): CachedMetadata {
  return {
    frontmatterLinks: [{ key: "carried from", link, original: `[[${link}]]`, displayText: link }],
    frontmatter: { "carried from": `[[${link}]]`, carried },
  };
}

describe("carriedGroupsOf", () => {
  it("keeps the groups the sheet carries, whatever their capitals", () => {
    expect(carriedGroupsOf(["Values", "abilities", "history"])).toEqual(["abilities", "values"]);
  });

  it("reads a single group written without a list", () => {
    expect(carriedGroupsOf("abilities")).toEqual(["abilities"]);
  });

  it("carries nothing when no group is listed", () => {
    expect(carriedGroupsOf(undefined)).toEqual([]);
    expect(carriedGroupsOf([3])).toEqual([]);
  });
});

describe("sheetNotesOf", () => {
  it("finds the note a character was carried from, with the groups listed", () => {
    const notes = sheetNotesOf(appWith(carriedFrom("Ashen Road/Characters/Mira", ["abilities"])));
    expect(notes.carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: ["abilities"] });
  });

  it("carries no group when the carried property is missing", () => {
    const notes = sheetNotesOf(appWith(carriedFrom("Ashen Road/Characters/Mira")));
    expect(notes.carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: [] });
  });

  it("finds nothing without a carried from link", () => {
    expect(sheetNotesOf(appWith(null)).carriedFromOf(MIRA)).toBeNull();
    expect(sheetNotesOf(appWith({})).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores a carried from link to no note", () => {
    expect(sheetNotesOf(appWith(carriedFrom("Nowhere/Mira"))).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores a carried from link back to the character's own note", () => {
    expect(sheetNotesOf(appWith(carriedFrom("Pale Moon/Characters/Mira", ["values"]))).carriedFromOf(MIRA)).toBeNull();
  });

  it("finds a note by its path", () => {
    expect(sheetNotesOf(appWith(null)).fileAt(OLD_MIRA)).toEqual({ path: OLD_MIRA });
  });
});
