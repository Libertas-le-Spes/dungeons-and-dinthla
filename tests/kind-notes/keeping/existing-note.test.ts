import { describe, expect, it, vi } from "vitest";
import { isOutOfStep, readExistingNote } from "../../../src/kind-notes/keeping/existing-note";
import type { WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { fileAt } from "../fake-notes";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";
const NOTE: WantedNote = { path: "D&D/Pale Moon/Questions/Session 2.md", folder: "Questions", sessionPath: SESSION, sessionFile: fileAt(SESSION), lines: ["? One"] };

function resolvedTo(resolves: boolean) {
  if (resolves) return fileAt(SESSION);
  return null;
}

function metadataWith(properties: Record<string, unknown> | null, resolves = true) {
  const resolved = resolvedTo(resolves);
  return {
    facts: { propertiesOf: vi.fn(() => properties) },
    links: { target: vi.fn(() => resolved) },
  };
}

describe("readExistingNote", () => {
  it("says a note Obsidian hasn't read isn't read", () => {
    expect(readExistingNote(metadataWith(null), fileAt(NOTE.path), NOTE)).toEqual({ read: false });
  });

  it("says whether the note is linked, holds the wanted lines and holds only the plugin's properties", () => {
    const properties = { session: "[[Session 2]]", lines: ["? One"], tags: [] };
    expect(readExistingNote(metadataWith(properties), fileAt(NOTE.path), NOTE)).toEqual({ read: true, linked: true, alreadyThere: true });
  });

  it("says a note linked to no session isn't linked", () => {
    const properties = { lines: ["? Old"] };
    expect(readExistingNote(metadataWith(properties, false), fileAt(NOTE.path), NOTE)).toEqual({ read: true, linked: false, alreadyThere: false });
  });
});

describe("isOutOfStep", () => {
  it("is true only for a note that is read, linked, and holds other lines", () => {
    expect(isOutOfStep({ read: true, linked: true, alreadyThere: false })).toBe(true);
    expect(isOutOfStep({ read: true, linked: true, alreadyThere: true })).toBe(false);
    expect(isOutOfStep({ read: true, linked: false, alreadyThere: false })).toBe(false);
    expect(isOutOfStep({ read: false })).toBe(false);
  });
});
