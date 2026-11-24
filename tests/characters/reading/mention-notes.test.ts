import { describe, expect, it, vi } from "vitest";
import { HostMentionNotes } from "../../../src/characters/reading/mention-notes";
import type { LinkFact, PropertyLinkFact } from "../../../src/host/notes/note-facts";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { fileAt } from "../../stubs/note-files";

const MIRA = "Pale Moon/Characters/Mira.md";
const VESS = "Pale Moon/Characters/Vess.md";
const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function linkAt(linkText: string, line: number): LinkFact {
  return { linkText, line };
}

interface NoteLinks {
  links?: LinkFact[];
  embeds?: LinkFact[];
  propertyLinks?: PropertyLinkFact[];
}

interface Stub {
  linkCounts?: Record<string, Record<string, number>>;
  read?: Record<string, NoteLinks>;
}

function factsOf(read: Record<string, NoteLinks>, note: NoteRef): Required<NoteLinks> {
  const none: Required<NoteLinks> = { links: [], embeds: [], propertyLinks: [] };
  const found = read[note.path];
  if (found === undefined) return none;
  return { ...none, ...found };
}

function notesWith({ linkCounts = {}, read = {} }: Stub) {
  const settled: ((note: NoteRef) => void)[] = [];
  const stop = vi.fn();
  const host = {
    store: {
      note: (path: string) => {
        if (read[path] === undefined) return null;
        return fileAt(path);
      },
      notes: () => [],
      readKept: async () => "",
    },
    facts: {
      propertiesOf: () => null,
      propertyLinksIn: (note: NoteRef) => factsOf(read, note).propertyLinks,
      linksIn: (note: NoteRef) => factsOf(read, note).links,
      embedsIn: (note: NoteRef) => factsOf(read, note).embeds,
    },
    links: {
      linkCounts: () => linkCounts,
      target: (linkPath: string) => {
        const path = [MIRA, VESS].find((candidate) => candidate.endsWith(`/${linkPath}.md`));
        if (path === undefined) return null;
        return fileAt(path);
      },
    },
    changes: {
      onRead: () => vi.fn(),
      onGone: () => vi.fn(),
      onMoved: () => vi.fn(),
      onLinksSettled: (heard: (note: NoteRef) => void) => {
        settled.push(heard);
        return stop;
      },
    },
  };
  const notes = new HostMentionNotes({ notes: host, syntax: STUB_SYNTAX, campaignFolders: () => ["Pale Moon"], sessionsOf: async () => [] });
  return { notes, settled, stop };
}

describe("HostMentionNotes", () => {
  it("finds the notes that link to a character from the link counts", () => {
    const { notes } = notesWith({ linkCounts: { [ONE]: { [MIRA]: 2 }, [TWO]: { [VESS]: 1 } } });
    expect(notes.linkingPaths(MIRA)).toEqual([ONE]);
  });

  it("finds each line with a link to the character once, however many links it has", () => {
    const { notes } = notesWith({ read: { [ONE]: { links: [linkAt("Mira", 3), linkAt("Mira", 3), linkAt("Mira", 7)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([3, 7]);
  });

  it("leaves out links to other notes and links that go nowhere", () => {
    const { notes } = notesWith({ read: { [ONE]: { links: [linkAt("Vess", 1), linkAt("Nobody", 2), linkAt("Mira", 4)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([4]);
  });

  it("counts a link to a heading in the character's note", () => {
    const { notes } = notesWith({ read: { [ONE]: { links: [linkAt("Mira#Stats", 5)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([5]);
  });

  it("counts an embed of the character's note as a link", () => {
    const { notes } = notesWith({ read: { [ONE]: { embeds: [linkAt("Mira", 2), linkAt("Vess", 3)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([2]);
  });

  it("finds the lines of links and embeds together", () => {
    const { notes } = notesWith({ read: { [ONE]: { links: [linkAt("Mira", 1)], embeds: [linkAt("Mira", 4)] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([1, 4]);
  });

  it("leaves out links in the note's properties", () => {
    const { notes } = notesWith({ read: { [ONE]: { propertyLinks: [{ key: "character", linkText: "Mira" }] } } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([]);
  });

  it("finds no lines in a note that isn't there, or with no links", () => {
    const { notes } = notesWith({ read: { [TWO]: {} } });
    expect(notes.linkedLines(ONE, MIRA)).toEqual([]);
    expect(notes.linkedLines(TWO, MIRA)).toEqual([]);
  });

  it("tells when a note's links are settled, and hands back the store's own stop", () => {
    const { notes, settled, stop } = notesWith({});
    const resolved: string[] = [];
    const stopListening = notes.onLinksResolved((path) => resolved.push(path));
    settled[0]!(fileAt(ONE));
    expect(resolved).toEqual([ONE]);
    expect(stopListening).toBe(stop);
  });
});
