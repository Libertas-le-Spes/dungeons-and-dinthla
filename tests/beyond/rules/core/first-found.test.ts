import { describe, expect, it } from "vitest";
import { firstFound } from "../../../../src/beyond/rules/core/first-found";

describe("firstFound", () => {
  it("is the first of a list", () => {
    expect(firstFound(["a", "b"])).toBe("a");
  });

  it("is nothing for an empty list", () => {
    expect(firstFound([])).toBeUndefined();
  });
});
