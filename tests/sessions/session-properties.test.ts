import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata } from "obsidian";
import { sessionPropertiesOf } from "../../src/sessions/session-properties";

const PATH = "Pale Moon/Sessions/Session 12.md";

function cacheWith(cache: CachedMetadata | null) {
  return { getCache: vi.fn((_path: string) => cache) };
}

describe("sessionPropertiesOf", () => {
  it("reads the session's title and played date, trimmed, from its own properties", () => {
    const cache = cacheWith({ frontmatter: { title: " The Old Mill ", played: "2026-11-09" } });
    expect(sessionPropertiesOf(PATH, cache)).toEqual({ title: "The Old Mill", played: "2026-11-09" });
    expect(cache.getCache).toHaveBeenCalledExactlyOnceWith(PATH);
  });

  it("leaves out what isn't written as text", () => {
    expect(sessionPropertiesOf(PATH, cacheWith({ frontmatter: { title: 12, played: ["2026-11-09"] } }))).toEqual({ title: "", played: "" });
    expect(sessionPropertiesOf(PATH, cacheWith({}))).toEqual({ title: "", played: "" });
    expect(sessionPropertiesOf(PATH, cacheWith(null))).toEqual({ title: "", played: "" });
  });
});
