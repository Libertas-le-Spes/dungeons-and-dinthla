import { describe, expect, it } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import type { Gate } from "../../src/fence/gatekeeper";
import { carriedGroupsOf, sheetNotesOf } from "../../src/characters/sheet-notes";

const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as TFile;
const OLD_MIRA = "Ashen Road/Characters/Mira.md";

const NO_CAMPAIGNS = () => [];

const vaultEvents = new Map<string, (...args: unknown[]) => void>();
const vaultEventsStopped: unknown[] = [];

function gateWith(cache: CachedMetadata | null, notes: string[] = [OLD_MIRA, MIRA.path]) {
  return {
    files: {
      on: (name: string, callback: (...args: unknown[]) => void) => {
        vaultEvents.set(name, callback);
        return { name };
      },
      offref: (event: unknown) => vaultEventsStopped.push(event),
      getFileByPath: (path: string) => {
        if (!notes.includes(path)) return null;
        return { path } as TFile;
      },
    },
    metadata: {
      getFileCache: () => cache,
      getFirstLinkpathDest: (linktext: string) => {
        const path = notes.find((note) => note === `${linktext}.md`);
        if (path === undefined) return null;
        return { path } as TFile;
      },
    },
  } as unknown as Gate;
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
    const notes = sheetNotesOf(gateWith(carriedFrom("Ashen Road/Characters/Mira", ["abilities"])), NO_CAMPAIGNS);
    expect(notes.carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: ["abilities"] });
  });

  it("carries no group when the carried property is missing", () => {
    const notes = sheetNotesOf(gateWith(carriedFrom("Ashen Road/Characters/Mira")), NO_CAMPAIGNS);
    expect(notes.carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: [] });
  });

  it("finds nothing without a carried from link", () => {
    expect(sheetNotesOf(gateWith(null), NO_CAMPAIGNS).carriedFromOf(MIRA)).toBeNull();
    expect(sheetNotesOf(gateWith({}), NO_CAMPAIGNS).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores links in other properties", () => {
    const cache = { frontmatterLinks: [{ key: "patron", link: "Ashen Road/Characters/Mira", original: "", displayText: "" }] };
    expect(sheetNotesOf(gateWith(cache), NO_CAMPAIGNS).carriedFromOf(MIRA)).toBeNull();
  });

  it("carries no group when the note's properties can't be read", () => {
    const cache = { frontmatterLinks: carriedFrom("Ashen Road/Characters/Mira").frontmatterLinks };
    expect(sheetNotesOf(gateWith(cache), NO_CAMPAIGNS).carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: [] });
  });

  it("ignores a carried from link to no note", () => {
    expect(sheetNotesOf(gateWith(carriedFrom("Nowhere/Mira")), NO_CAMPAIGNS).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores a carried from link back to the character's own note", () => {
    expect(sheetNotesOf(gateWith(carriedFrom("Pale Moon/Characters/Mira", ["values"])), NO_CAMPAIGNS).carriedFromOf(MIRA)).toBeNull();
  });

  it("finds a note by its path", () => {
    expect(sheetNotesOf(gateWith(null), NO_CAMPAIGNS).fileAt(OLD_MIRA)).toEqual({ path: OLD_MIRA });
  });
});

describe("onNoteMoved", () => {
  it("tells of a deleted note, and of both paths of a renamed one, until stopped", () => {
    const moved: string[] = [];
    const stop = sheetNotesOf(gateWith(null), NO_CAMPAIGNS).onNoteMoved((path) => moved.push(path));
    vaultEvents.get("delete")!({ path: "Pale Moon/Sessions/Session 2.md" });
    vaultEvents.get("rename")!({ path: "Pale Moon/Sessions/Session 4.md" }, "Pale Moon/Sessions/Session 3.md");
    expect(moved).toEqual(["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 4.md"]);
    stop();
    expect(vaultEventsStopped).toEqual([{ name: "delete" }, { name: "rename" }]);
  });
});
