import { describe, expect, it } from "vitest";
import { sameName } from "../../../../src/beyond/rules/core/same-name";

describe("sameName", () => {
  it.each([
    { first: "Alert", second: "alert" },
    { first: "  Alert ", second: "ALERT" },
    { first: "Thri-kreen", second: "Thri-Kreen" },
  ])("treats $first and $second as one name", ({ first, second }) => {
    expect(sameName(first, second)).toBe(true);
  });

  it.each([
    { first: "Alert", second: "Alerts" },
    { first: "Thri kreen", second: "Thri-kreen" },
    { first: "", second: "Alert" },
  ])("treats $first and $second as two names", ({ first, second }) => {
    expect(sameName(first, second)).toBe(false);
  });
});
