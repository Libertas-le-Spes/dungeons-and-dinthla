import { describe, expect, it } from "vitest";
import { playedDateOf } from "../../src/sessions/played-date";

describe("playedDateOf", () => {
  it("writes the local date as year, month and day", () => {
    expect(playedDateOf(new Date(2026, 2, 4, 23, 30))).toBe("2026-03-04");
  });

  it("keeps the local day late at night", () => {
    expect(playedDateOf(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});
