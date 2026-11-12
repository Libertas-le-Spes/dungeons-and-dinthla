import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata } from "obsidian";
import { isOutOfStep, readExistingNote } from "../../../src/kind-notes/keeping/existing-note";
import type { WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { fileAt } from "../fake-notes";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";
const NOTE: WantedNote = { path: "D&D/Pale Moon/Questions/Session 2.md", folder: "Questions", sessionPath: SESSION, sessionFile: fileAt(SESSION), lines: ["? One"] };

function resolvedTo(resolves: boolean) {
  if (resolves) return fileAt(SESSION);
  return null;
}

function metadataWith(cache: CachedMetadata | null, resolves = true) {
  const resolved = resolvedTo(resolves);
  return {
    getFileCache: vi.fn(() => cache),
    fileToLinktext: vi.fn(() => "Session 2"),
    getFirstLinkpathDest: vi.fn(() => resolved),
  };
}

function cacheOf(properties: Record<string, unknown>): CachedMetadata {
  return { frontmatter: properties } as CachedMetadata;
}

describe("readExistingNote", () => {
  it("says a note Obsidian hasn't read isn't read", () => {
    expect(readExistingNote(metadataWith(null), fileAt(NOTE.path), NOTE)).toEqual({ read: false });
  });

  it("says whether the note is linked, holds the wanted lines and holds only the plugin's properties", () => {
    const cache = cacheOf({ session: "[[Session 2]]", lines: ["? One"], tags: [] });
    expect(readExistingNote(metadataWith(cache), fileAt(NOTE.path), NOTE)).toEqual({ read: true, linked: true, alreadyThere: true, onlyPluginProperties: false });
  });

  it("says a note linked to no session isn't linked", () => {
    const cache = cacheOf({ lines: ["? Old"] });
    expect(readExistingNote(metadataWith(cache, false), fileAt(NOTE.path), NOTE)).toEqual({ read: true, linked: false, alreadyThere: false, onlyPluginProperties: true });
  });
});

describe("isOutOfStep", () => {
  it("is true only for a note that is read, linked, and holds other lines", () => {
    expect(isOutOfStep({ read: true, linked: true, alreadyThere: false, onlyPluginProperties: true })).toBe(true);
    expect(isOutOfStep({ read: true, linked: true, alreadyThere: true, onlyPluginProperties: true })).toBe(false);
    expect(isOutOfStep({ read: true, linked: false, alreadyThere: false, onlyPluginProperties: true })).toBe(false);
    expect(isOutOfStep({ read: false })).toBe(false);
  });
});
