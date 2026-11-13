import { describe, expect, it } from "vitest";
import type { CachedMetadata } from "obsidian";
import { aliasesWith, itemNoteChange } from "../../../src/funds/item-notes/item-note-change";

function cacheOf(properties: Record<string, unknown>): CachedMetadata {
  return { frontmatter: properties } as CachedMetadata;
}

function applied(cache: CachedMetadata, wanted: Parameters<typeof itemNoteChange>[1]): Record<string, unknown> | null {
  const change = itemNoteChange(cache, wanted);
  if (change === null) return null;
  const properties = { ...cache.frontmatter };
  change(properties);
  return properties;
}

describe("aliasesWith", () => {
  it("adds an alias a note's aliases lack, after the ones it has", () => {
    expect(aliasesWith({ aliases: ["The Ring"] }, "Ring: +1")).toEqual(["The Ring", "Ring: +1"]);
  });

  it("keeps the aliases as they are when the alias is among them", () => {
    expect(aliasesWith({ aliases: ["Ring: +1", "The Ring"] }, "Ring: +1")).toEqual(["Ring: +1", "The Ring"]);
  });

  it("starts the aliases when the note has none, or has one written as plain text", () => {
    expect(aliasesWith({}, "Ring: +1")).toEqual(["Ring: +1"]);
    expect(aliasesWith({ aliases: "The Ring" }, "Ring: +1")).toEqual(["The Ring", "Ring: +1"]);
  });

  it("keeps what isn't a text in a list of aliases, since it is his", () => {
    expect(aliasesWith({ aliases: ["The Ring", 4, null] }, "Ring: +1")).toEqual(["The Ring", 4, null, "Ring: +1"]);
  });

  it("starts the aliases when what the note has isn't a list or a text", () => {
    expect(aliasesWith({ aliases: 4 }, "Ring: +1")).toEqual(["Ring: +1"]);
  });
});

describe("itemNoteChange", () => {
  it("is no change when the holder is as wanted and no lines or alias are wanted", () => {
    expect(itemNoteChange(cacheOf({ holder: "The party" }), { holder: "The party", lines: null, alias: null })).toBeNull();
  });

  it("is no change when the holder, the lines and the alias are all as wanted", () => {
    const cache = cacheOf({ holder: "The party", lines: ["$ Rope"], aliases: ["Ring: +1"] });
    expect(itemNoteChange(cache, { holder: "The party", lines: ["$ Rope"], alias: "Ring: +1" })).toBeNull();
  });

  it("sets only the holder when no lines are wanted, and keeps the lines already there", () => {
    const cache = cacheOf({ holder: "Old Tom", lines: ["$ Old"] });
    expect(applied(cache, { holder: "The party", lines: null, alias: null })).toEqual({ holder: "The party", lines: ["$ Old"] });
  });

  it("sets the lines when they differ, with the holder, and keeps his other properties", () => {
    const cache = cacheOf({ holder: "The party", tags: ["pale"], lines: ["$ Old"] });
    expect(applied(cache, { holder: "The party", lines: ["$ Rope"], alias: null })).toEqual({ holder: "The party", tags: ["pale"], lines: ["$ Rope"] });
  });

  it("is a change when only the alias is missing", () => {
    const cache = cacheOf({ holder: "The party", lines: ["$ Rope"] });
    expect(applied(cache, { holder: "The party", lines: ["$ Rope"], alias: "Ring: +1" })).toEqual({ holder: "The party", lines: ["$ Rope"], aliases: ["Ring: +1"] });
  });

  it("is a change for a note with no properties at all", () => {
    expect(applied({}, { holder: "The party", lines: ["$ Rope"], alias: null })).toEqual({ holder: "The party", lines: ["$ Rope"] });
  });
});
