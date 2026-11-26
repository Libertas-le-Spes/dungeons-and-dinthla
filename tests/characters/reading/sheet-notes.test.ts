import { describe, expect, it, vi } from "vitest";
import { carriedGroupsOf, HostSheetNotes } from "../../../src/characters/reading/sheet-notes";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { fileAt } from "../../stubs/note-files";

const MIRA = fileAt("Pale Moon/Characters/Mira.md");
const OLD_MIRA = "Ashen Road/Characters/Mira.md";

const NO_CAMPAIGNS = () => [];

interface Held {
  properties: Record<string, unknown> | null;
  links: { key: string; linkText: string }[];
}

const NOTHING_HELD: Held = { properties: null, links: [] };

function hostWith(held: Held, notes: string[] = [OLD_MIRA, MIRA.path]) {
  const heardGone: ((path: string) => void)[] = [];
  const heardMoved: ((note: NoteRef, oldPath: string) => void)[] = [];
  const stopGone = vi.fn();
  const stopMoved = vi.fn();
  const host = {
    store: {
      note: (path: string) => {
        if (path === MIRA.path) return MIRA;
        if (!notes.includes(path)) return null;
        return fileAt(path);
      },
      notes: () => [],
      readKept: async () => "",
    },
    facts: {
      propertiesOf: () => held.properties,
      propertyLinksIn: () => held.links,
    },
    links: {
      target: (linkText: string) => {
        const path = notes.find((note) => note === `${linkText}.md`);
        if (path === undefined) return null;
        return fileAt(path);
      },
    },
    changes: {
      onRead: () => vi.fn(),
      onGone: (heard: (path: string) => void) => {
        heardGone.push(heard);
        return stopGone;
      },
      onMoved: (heard: (note: NoteRef, oldPath: string) => void) => {
        heardMoved.push(heard);
        return stopMoved;
      },
    },
  };
  return { host, heardGone, heardMoved, stopGone, stopMoved };
}

function notesOver(held: Held, notes?: string[]) {
  return new HostSheetNotes({ notes: hostWith(held, notes).host, campaignFolders: NO_CAMPAIGNS, sessionsOf: async () => [] });
}

function carriedFrom(linkText: string, carried?: unknown): Held {
  return { links: [{ key: "carried from", linkText }], properties: { "carried from": `[[${linkText}]]`, carried } };
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

describe("HostSheetNotes", () => {
  it("finds the note a character was carried from, with the groups listed", () => {
    expect(notesOver(carriedFrom("Ashen Road/Characters/Mira", ["abilities"])).carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: ["abilities"] });
  });

  it("carries no group when the carried property is missing", () => {
    expect(notesOver(carriedFrom("Ashen Road/Characters/Mira")).carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: [] });
  });

  it("finds nothing for a note not read yet, even with a carried from link", () => {
    const links = carriedFrom("Ashen Road/Characters/Mira").links;
    expect(notesOver({ properties: null, links }).carriedFromOf(MIRA)).toBeNull();
  });

  it("finds nothing without a carried from link", () => {
    expect(notesOver({ properties: {}, links: [] }).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores links in other properties", () => {
    expect(notesOver({ properties: {}, links: [{ key: "patron", linkText: "Ashen Road/Characters/Mira" }] }).carriedFromOf(MIRA)).toBeNull();
  });

  it("carries no group when the note holds no properties beyond the link", () => {
    const links = carriedFrom("Ashen Road/Characters/Mira").links;
    expect(notesOver({ properties: {}, links }).carriedFromOf(MIRA)).toEqual({ path: OLD_MIRA, groups: [] });
  });

  it("ignores a carried from link to no note", () => {
    expect(notesOver(carriedFrom("Nowhere/Mira")).carriedFromOf(MIRA)).toBeNull();
  });

  it("ignores a carried from link back to the character's own note", () => {
    expect(notesOver(carriedFrom("Pale Moon/Characters/Mira", ["values"])).carriedFromOf(MIRA)).toBeNull();
  });

  it("reads no stand-in for the character's note, though it shares the note's path", () => {
    expect(() => notesOver(carriedFrom("Ashen Road/Characters/Mira")).carriedFromOf(fileAt(MIRA.path))).toThrow("Couldn't use Pale Moon/Characters/Mira.md");
  });

  it("finds a note by its path", () => {
    expect(notesOver(NOTHING_HELD).fileAt(OLD_MIRA)?.path).toBe(OLD_MIRA);
    expect(notesOver(NOTHING_HELD).fileAt("Nowhere/Mira.md")).toBeNull();
  });
});

describe("onNoteMoved", () => {
  it("tells of a gone note, and of both paths of a moved one, and stops both", () => {
    const { host, heardGone, heardMoved, stopGone, stopMoved } = hostWith(NOTHING_HELD);
    const moved: string[] = [];
    const notes = new HostSheetNotes({ notes: host, campaignFolders: NO_CAMPAIGNS, sessionsOf: async () => [] });
    const stop = notes.onNoteMoved((path) => moved.push(path));
    heardGone[0]!("Pale Moon/Sessions/Session 2.md");
    heardMoved[0]!(fileAt("Pale Moon/Sessions/Session 4.md"), "Pale Moon/Sessions/Session 3.md");
    expect(moved).toEqual(["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 4.md"]);
    expect(stopGone).not.toHaveBeenCalled();
    stop();
    expect(stopGone).toHaveBeenCalledOnce();
    expect(stopMoved).toHaveBeenCalledOnce();
  });
});
