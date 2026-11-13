import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { GateCast } from "../../../src/imports/leaving/switching/gate-cast";
import { CAMPAIGN_NOTE_UNREAD, MAIN_UNCLEAR } from "../../../src/imports/leaving/switching/switch-words";

const CAMPAIGN = "D&D/Primary Campaign";
const CAMPAIGN_NOTE = `${CAMPAIGN}/Primary Campaign.md`;

function noteAt(path: string): TFile {
  const name = path.substring(path.lastIndexOf("/") + 1);
  return { path, basename: name.replace(/\.md$/, "") } as TFile;
}

const MONK = noteAt(`${CAMPAIGN}/Characters/Primary Monk.md`);

interface Cache {
  frontmatter?: Record<string, unknown>;
  frontmatterLinks?: { key: string; link: string; original: string; displayText: string }[];
}

class MadeUpMetadata {
  readonly caches = new Map<string, Cache>();
  readonly notes: TFile[] = [MONK];

  getCache(path: string): Cache | null {
    const cache = this.caches.get(path);
    if (cache === undefined) return null;
    return cache;
  }

  getFileCache(file: TFile): Cache | null {
    return this.getCache(file.path);
  }

  getFirstLinkpathDest(linkpath: string): TFile | null {
    for (const note of this.notes) {
      if (note.basename === linkpath) return note;
    }
    return null;
  }

  fileToLinktext(file: TFile, sourcePath: string): string {
    return `${file.basename} from ${sourcePath}`;
  }
}

class MadeUpFiles {
  constructor(private readonly paths: readonly string[]) {}

  getFiles(): TFile[] {
    const files: TFile[] = [];
    for (const path of this.paths) files.push(noteAt(path));
    return files;
  }
}

function linkTo(name: string): { key: string; link: string; original: string; displayText: string } {
  return { key: "character", link: name, original: `[[${name}]]`, displayText: name };
}

function castWith(cache: Cache | null, paths: readonly string[] = []): GateCast {
  const metadata = new MadeUpMetadata();
  if (cache !== null) metadata.caches.set(CAMPAIGN_NOTE, cache);
  metadata.caches.set(MONK.path, { frontmatter: { species: "Human", class: "Monk 4" } });
  return new GateCast(metadata, new MadeUpFiles(paths));
}

function refusalOf(cast: GateCast): string {
  try {
    cast.mainOf(CAMPAIGN);
  } catch (error) {
    if (error instanceof Refusal) return error.message;
    throw error;
  }
  throw new Error("Nothing was refused.");
}

describe("the campaign's main character", () => {
  it("is the note the character property links to, whatever other properties link to", () => {
    const background = { key: "background", link: "Secondary", original: "[[Secondary]]", displayText: "Secondary" };
    expect(castWith({ frontmatter: { character: "[[Primary Monk]]" }, frontmatterLinks: [background, linkTo("Primary Monk")] }).mainOf(CAMPAIGN)).toBe(MONK);
  });

  it("is nobody when the property is missing or empty", () => {
    expect(castWith({ frontmatter: { role: "player" } }).mainOf(CAMPAIGN)).toBeNull();
    expect(castWith({ frontmatter: { character: null } }).mainOf(CAMPAIGN)).toBeNull();
    expect(castWith({ frontmatter: { character: "" } }).mainOf(CAMPAIGN)).toBeNull();
    expect(castWith({}).mainOf(CAMPAIGN)).toBeNull();
  });

  it("is refused when the property holds text, two links, or a link to no note", () => {
    expect(refusalOf(castWith({ frontmatter: { character: "Primary Monk" } }))).toBe(MAIN_UNCLEAR);
    expect(refusalOf(castWith({ frontmatter: { character: "x" }, frontmatterLinks: [linkTo("Primary Monk"), linkTo("Secondary")] }))).toBe(MAIN_UNCLEAR);
    expect(refusalOf(castWith({ frontmatter: { character: "x" }, frontmatterLinks: [linkTo("Nobody")] }))).toBe(MAIN_UNCLEAR);
  });

  it("is refused when the campaign note can't be read", () => {
    expect(refusalOf(castWith(null))).toBe(CAMPAIGN_NOTE_UNREAD);
  });
});

describe("what the cast knows of a character", () => {
  it("gives the species and class from the note's properties, and nothing for a value that isn't text", () => {
    expect(castWith(null).identityOf(MONK)).toEqual({ name: "Primary Monk", species: "Human", classes: "Monk 4" });
    expect(castWith(null).identityOf(noteAt(`${CAMPAIGN}/Characters/Secondary.md`))).toEqual({ name: "Secondary", species: null, classes: null });
  });

  it("links the newest session of the campaign, and nothing when there is none", () => {
    const paths = [`${CAMPAIGN}/Sessions/Session 2.md`, `${CAMPAIGN}/Sessions/Session 10.md`, `${CAMPAIGN}/Sessions/Session 7.md`, "D&D/Secondary Campaign/Sessions/Session 40.md"];
    expect(castWith(null, paths).newestSessionLink(CAMPAIGN, "here")).toBe("Session 10 from here");
    expect(castWith(null).newestSessionLink(CAMPAIGN, "here")).toBeNull();
  });
});
