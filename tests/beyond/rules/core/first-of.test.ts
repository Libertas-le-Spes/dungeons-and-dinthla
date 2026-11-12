import { describe, expect, it } from "vitest";
import { firstOf } from "../../../../src/beyond/rules/core/first-of";

describe("firstOf", () => {
  it("is the first of a list", () => {
    expect(firstOf(["a", "b"])).toBe("a");
  });

  it("is nothing for an empty list", () => {
    expect(firstOf([])).toBeUndefined();
  });
});
