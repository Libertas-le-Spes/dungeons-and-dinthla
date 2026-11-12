import { describe, expect, it } from "vitest";
import type { CachedMetadata } from "obsidian";
import { holdsOnlyPluginProperties, linesIn, sameLines, sessionPropertyIn } from "../../src/note-keeping/note-properties";

function cacheOf(properties: Record<string, unknown> | undefined): CachedMetadata {
  if (properties === undefined) return {};
  return { frontmatter: properties } as CachedMetadata;
}

describe("linesIn", () => {
  it("is the list of lines the note holds", () => {
    expect(linesIn(cacheOf({ lines: ["? One", "$ Two"] }))).toEqual(["? One", "$ Two"]);
  });

  it("is an empty list for a note with no properties, no lines or an empty value", () => {
    expect(linesIn(cacheOf(undefined))).toEqual([]);
    expect(linesIn(cacheOf({}))).toEqual([]);
    expect(linesIn(cacheOf({ lines: null }))).toEqual([]);
  });

  it("is nothing for lines that aren't a list of texts", () => {
    expect(linesIn(cacheOf({ lines: "? One" }))).toBeNull();
    expect(linesIn(cacheOf({ lines: ["? One", 2] }))).toBeNull();
  });
});

describe("sessionPropertyIn", () => {
  it("is what the session property holds, or nothing", () => {
    expect(sessionPropertyIn(cacheOf({ session: "[[Session 2]]" }))).toBe("[[Session 2]]");
    expect(sessionPropertyIn(cacheOf({}))).toBeUndefined();
    expect(sessionPropertyIn(cacheOf(undefined))).toBeUndefined();
  });
});

describe("holdsOnlyPluginProperties", () => {
  it("is true when the only properties are session and lines, or there are none", () => {
    expect(holdsOnlyPluginProperties(cacheOf({ session: "[[Session 2]]", lines: [] }))).toBe(true);
    expect(holdsOnlyPluginProperties(cacheOf(undefined))).toBe(true);
  });

  it("is false when another property is there", () => {
    expect(holdsOnlyPluginProperties(cacheOf({ session: "[[Session 2]]", tags: [] }))).toBe(false);
  });
});

describe("sameLines", () => {
  it("is true for the same lines in the same order", () => {
    expect(sameLines(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("is false for other lines, other order, or lines that couldn't be read", () => {
    expect(sameLines(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameLines(["a"], ["a", "b"])).toBe(false);
    expect(sameLines(null, [])).toBe(false);
  });
});
