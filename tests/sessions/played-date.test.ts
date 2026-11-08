import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playedDateOf, withPlayedDate } from "../../src/sessions/played-date";

describe("playedDateOf", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "Africa/Johannesburg");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes the local date as year, month and day", () => {
    expect(playedDateOf(new Date(2026, 2, 4, 12, 0))).toBe("2026-03-04");
  });

  it("keeps the local day just after midnight, ahead of UTC", () => {
    expect(playedDateOf(new Date(2026, 2, 4, 0, 30))).toBe("2026-03-04");
  });
});

describe("withPlayedDate", () => {
  it("keeps the date the player chose", () => {
    expect(withPlayedDate({ title: "", played: "2026-03-21" }, new Date(2026, 2, 4)).played).toBe("2026-03-21");
  });

  it("falls back to today when the date was cleared", () => {
    expect(withPlayedDate({ title: "The ford", played: "" }, new Date(2026, 2, 4, 12))).toEqual({
      title: "The ford",
      played: "2026-03-04",
    });
  });
});
