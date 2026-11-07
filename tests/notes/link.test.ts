import { describe, expect, it } from "vitest";
import { findLinks, unlink } from "../../src/notes/link";

describe("findLinks", () => {
  it("finds every linked name in order", () => {
    expect(findLinks("[[Lady Vess]] sent it, through [[Mira]]")).toEqual(["Lady Vess", "Mira"]);
  });

  it("finds nothing in a line without links", () => {
    expect(findLinks("No names here")).toEqual([]);
  });
});

describe("unlink", () => {
  it("keeps the names and drops the brackets", () => {
    expect(unlink("Return the caravan to [[Lady Vess]]")).toBe("Return the caravan to Lady Vess");
  });
});
