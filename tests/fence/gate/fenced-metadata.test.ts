import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, TFile } from "obsidian";
import { Fence, OUTSIDE_FENCE } from "../../../src/fence/paths/fence";
import { FencedMetadata, type RawMetadata } from "../../../src/fence/gate/fenced-metadata";
import { HeldFiles } from "../../../src/fence/gate/held-files";
import { FakeEvents, fileAt, rawVaultWith } from "./fake-raw-vault";

const CONFIG_DIR = ".obsidian";

const SESSION = fileAt("D&D/Pale Moon/Sessions/Session 1.md");
const MIRA = fileAt("D&D/Pale Moon/Characters/Mira.md");
const PRIVATE = fileAt("Private/Primary.md");
const CACHE = { frontmatter: { title: "The Old Mill" } } as unknown as CachedMetadata;

function metadataWith(linkLeadsTo: TFile | null = MIRA) {
  const { vault } = rawVaultWith([SESSION, MIRA, PRIVATE]);
  const events = new FakeEvents();
  const raw = {
    getCache: vi.fn(() => CACHE),
    getFileCache: vi.fn(() => CACHE),
    getFirstLinkpathDest: vi.fn(() => linkLeadsTo),
    fileToLinktext: vi.fn((file: TFile) => `link to ${file.path}`),
    unresolvedLinks: {
      [SESSION.path]: { "Lady Vess": 1, "Old Mill": 2 },
      [PRIVATE.path]: { "Secret Name": 1 },
    },
    resolvedLinks: {
      [SESSION.path]: { [MIRA.path]: 2, [PRIVATE.path]: 1 },
      [PRIVATE.path]: { [MIRA.path]: 1 },
    },
    on: (name: string, callback: (...data: unknown[]) => unknown) => events.on(name, callback),
    offref: vi.fn(),
  };
  const held = new HeldFiles(vault, new Fence(() => "D&D", CONFIG_DIR));
  return { metadata: new FencedMetadata(raw as unknown as RawMetadata, held), raw, events };
}

describe("FencedMetadata lookups", () => {
  it("gives the cache of a note inside", () => {
    const { metadata } = metadataWith();
    expect(metadata.getCache(SESSION.path)).toBe(CACHE);
    expect(metadata.getFileCache(SESSION)).toBe(CACHE);
  });

  it("gives no cache for a note outside, without asking Obsidian", () => {
    const { metadata, raw } = metadataWith();
    expect(metadata.getCache(PRIVATE.path)).toBeNull();
    expect(metadata.getFileCache(PRIVATE)).toBeNull();
    expect(raw.getCache).not.toHaveBeenCalled();
    expect(raw.getFileCache).not.toHaveBeenCalled();
  });

  it("follows a link from a note inside to a note inside", () => {
    const { metadata } = metadataWith(MIRA);
    expect(metadata.getFirstLinkpathDest("Mira", SESSION.path)).toBe(MIRA);
  });

  it("gives nothing for a link that leads outside", () => {
    const { metadata } = metadataWith(PRIVATE);
    expect(metadata.getFirstLinkpathDest("Primary", SESSION.path)).toBeNull();
  });

  it("follows no link from a note outside", () => {
    const { metadata, raw } = metadataWith(MIRA);
    expect(metadata.getFirstLinkpathDest("Mira", PRIVATE.path)).toBeNull();
    expect(raw.getFirstLinkpathDest).not.toHaveBeenCalled();
  });

  it("writes a link to a note inside from a note inside, and refuses one that leaves the Campaigns folder", () => {
    const { metadata, raw } = metadataWith();
    expect(metadata.fileToLinktext(MIRA, SESSION.path, true)).toBe(`link to ${MIRA.path}`);
    expect(() => metadata.fileToLinktext(PRIVATE, SESSION.path, true)).toThrow(OUTSIDE_FENCE);
    expect(() => metadata.fileToLinktext(MIRA, PRIVATE.path, true)).toThrow(OUTSIDE_FENCE);
    expect(raw.fileToLinktext).toHaveBeenCalledOnce();
  });

  it("lists only links between notes inside", () => {
    expect(metadataWith().metadata.resolvedLinks).toEqual({ [SESSION.path]: { [MIRA.path]: 2 } });
  });
});

describe("FencedMetadata unresolved links", () => {
  it("gives the link texts Obsidian could not resolve in a note inside, and never a path or a count", () => {
    expect(metadataWith().metadata.unresolvedLinksOf(SESSION.path)).toEqual(["Lady Vess", "Old Mill"]);
  });

  it("gives nothing for a note outside, though Obsidian lists links for it", () => {
    expect(metadataWith().metadata.unresolvedLinksOf(PRIVATE.path)).toEqual([]);
  });

  it("gives nothing for a note inside that Obsidian has no unresolved links for", () => {
    expect(metadataWith().metadata.unresolvedLinksOf(MIRA.path)).toEqual([]);
  });
});

describe("FencedMetadata events", () => {
  it("passes on a note inside that changed or was resolved", () => {
    const { metadata, events } = metadataWith();
    const changed = vi.fn();
    const resolved = vi.fn();
    metadata.on("changed", changed);
    metadata.on("resolve", resolved);
    events.trigger("changed", SESSION, "text", CACHE);
    events.trigger("resolve", MIRA);
    expect(changed).toHaveBeenCalledExactlyOnceWith(SESSION, "text", CACHE);
    expect(resolved).toHaveBeenCalledOnce();
  });

  it("drops a note outside that changed or was resolved", () => {
    const { metadata, events } = metadataWith();
    const heard = vi.fn();
    metadata.on("changed", heard);
    metadata.on("resolve", heard);
    events.trigger("changed", PRIVATE, "text", CACHE);
    events.trigger("resolve", PRIVATE);
    expect(heard).not.toHaveBeenCalled();
  });

  it("stops listening when asked", () => {
    const { metadata, raw } = metadataWith();
    const ref = metadata.on("resolve", () => {});
    metadata.offref(ref);
    expect(raw.offref).toHaveBeenCalledExactlyOnceWith(ref);
  });
});
