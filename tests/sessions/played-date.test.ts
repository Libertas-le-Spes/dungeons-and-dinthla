import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playedDateOf, shownPlayedDate, withPlayedDate } from "../../src/sessions/played-date";

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

describe("shownPlayedDate", () => {
  it("shows a played date as day, short month and year, without a leading zero", () => {
    expect(shownPlayedDate("2026-11-09")).toBe("9 Nov 2026");
    expect(shownPlayedDate("2026-01-31")).toBe("31 Jan 2026");
  });

  it("shows nothing for a date it can't read", () => {
    expect(shownPlayedDate("")).toBe("");
    expect(shownPlayedDate("9 Nov 2026")).toBe("");
    expect(shownPlayedDate("2026-13-01")).toBe("");
    expect(shownPlayedDate("2026-00-01")).toBe("");
    expect(shownPlayedDate("2026-11-00")).toBe("");
    expect(shownPlayedDate("2026-11-32")).toBe("");
  });
});
