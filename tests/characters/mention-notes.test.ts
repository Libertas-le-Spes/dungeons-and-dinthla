import { describe, expect, it } from "vitest";
import type { App, CachedMetadata, LinkCache, TFile } from "obsidian";
import { mentionNotesOf } from "../../src/characters/mention-notes";

const MIRA = "Pale Moon/Characters/Mira.md";
const VESS = "Pale Moon/Characters/Vess.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function linkAt(link: string, line: number): LinkCache {
  const position = { start: { line, col: 0, offset: 0 }, end: { line, col: 0, offset: 0 } };
  return { link, original: `[[${link}]]`, displayText: link, position };
}

interface Stub {
  resolvedLinks?: Record<string, Record<string, number>>;
  caches?: Record<string, CachedMetadata>;
}

function appWith({ resolvedLinks = {}, caches = {} }: Stub) {
  const events: { resolve: (file: TFile) => void } = { resolve: () => {} };
  const stopped: unknown[] = [];
  const app = {
    vault: { on: () => ({}), offref: () => {}, getFileByPath: () => null, cachedRead: async () => "" },
    metadataCache: {
      resolvedLinks,
      getCache: (path: string) => {
        const cache = caches[path];
        if (cache === undefined) return null;
        return cache;
      },
      getFirstLinkpathDest: (linkpath: string) => {
        const path = [MIRA, VESS].find((candidate) => candidate.endsWith(`/${linkpath}.md`));
        if (path === undefined) return null;
        return { path } as TFile;
      },
      on: (name: string, callback: (file: TFile) => void) => {
        if (name === "resolve") events.resolve = callback;
        return { name };
      },
      offref: (event: unknown) => stopped.push(event),
    },
  } as unknown as App;
  return { notes: mentionNotesOf(app), events, stopped };
}

describe("mentionNotesOf", () => {
  it("finds the notes that link to a character from Obsidian's resolved links", () => {
    const { notes } = appWith({ resolvedLinks: { [ONE]: { [MIRA]: 2 }, [TWO]: { [VESS]: 1 } } });
    expect(notes.linkingPaths(MIRA)).toEqual([ONE]);
  });

  it("finds each line with a link to the character once, however many links it has", () => {
    const { notes } = appWith({ caches: { [ONE]: { links: [linkAt("Mira", 3), linkAt("Mira", 3), linkAt("Mira", 7)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([3, 7]);
  });

  it("leaves out links to other notes and links that go nowhere", () => {
    const { notes } = appWith({ caches: { [ONE]: { links: [linkAt("Vess", 1), linkAt("Nobody", 2), linkAt("Mira", 4)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([4]);
  });

  it("counts a link to a heading in the character's note", () => {
    const { notes } = appWith({ caches: { [ONE]: { links: [linkAt("Mira#Stats", 5)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([5]);
  });

  it("counts an embed of the character's note as a link", () => {
    const { notes } = appWith({ caches: { [ONE]: { embeds: [linkAt("Mira", 2), linkAt("Vess", 3)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([2]);
  });

  it("finds the lines of links and embeds together", () => {
    const { notes } = appWith({ caches: { [ONE]: { links: [linkAt("Mira", 1)], embeds: [linkAt("Mira", 4)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([1, 4]);
  });

  it("leaves out links in the note's properties", () => {
    const cache = { frontmatterLinks: [{ key: "character", link: "Mira", original: "[[Mira]]", displayText: "Mira" }] };
    const { notes } = appWith({ caches: { [ONE]: cache } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([]);
  });

  it("finds no lines in a note Obsidian hasn't read, or with no links", () => {
    const { notes } = appWith({ caches: { [TWO]: {} } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([]);
    expect(notes.linkedLines(TWO, MIRA)).toEqual([]);
  });

  it("tells when a note's links are resolved, until stopped", () => {
    const { notes, events, stopped } = appWith({});
    const resolved: string[] = [];
    const stop = notes.onLinksResolved((path) => resolved.push(path));
    events.resolve({ path: ONE } as TFile);
    expect(resolved).toEqual([ONE]);
    stop();
    expect(stopped).toEqual([{ name: "resolve" }]);
  });
});
