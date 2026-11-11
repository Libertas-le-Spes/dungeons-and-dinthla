import { describe, expect, it } from "vitest";
import { keywordsOf } from "../../../src/views/lists/keywords";

describe("keywordsOf", () => {
  it("splits a filter into lower-case words", () => {
    expect(keywordsOf("  Old   MILL ")).toEqual(["old", "mill"]);
  });

  it("reads an empty filter as no words", () => {
    expect(keywordsOf("   ")).toEqual([]);
  });
});
