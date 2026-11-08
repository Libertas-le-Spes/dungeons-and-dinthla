import { describe, expect, it } from "vitest";
import type { CachedMetadata } from "obsidian";
import { sessionHeadingOf } from "../../src/sessions/session-heading";

const PATH = "Pale Moon/Sessions/Session 13.md";

function cacheWith(cache: CachedMetadata | null) {
  return {
    getCache: (path: string) => {
      if (path !== PATH) return null;
      return cache;
    },
  };
}

describe("sessionHeadingOf", () => {
  it("names the session and its title", () => {
    expect(sessionHeadingOf(PATH, cacheWith({ frontmatter: { title: " The ferry at dusk " } }))).toBe("Session 13 · The ferry at dusk");
  });

  it("names only the session without a title, a written one, or properties", () => {
    expect(sessionHeadingOf(PATH, cacheWith({ frontmatter: { played: "2026-03-14" } }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, cacheWith({ frontmatter: { title: "  " } }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, cacheWith({ frontmatter: { title: 13 } }))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, cacheWith({}))).toBe("Session 13");
    expect(sessionHeadingOf(PATH, cacheWith(null))).toBe("Session 13");
  });
});
