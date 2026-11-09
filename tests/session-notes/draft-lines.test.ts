import { describe, expect, it } from "vitest";
import { hasLinesToSave, linesToSave, lookupLinesLeft } from "../../src/session-notes/draft-lines";

const DRAFT = ["  ? Who owns the Old Mill  ", "", "?? letter", "   ", "! Find the caravan, from: [[Lady Vess]]", "$$ lantern", "$$ Silvered lantern :sold 30 gp"].join("\n");

describe("linesToSave", () => {
  it("takes every written line but lookups, trimmed, in the order typed", () => {
    expect(linesToSave(DRAFT)).toEqual(["? Who owns the Old Mill", "! Find the caravan, from: [[Lady Vess]]", "$$ Silvered lantern :sold 30 gp"]);
  });

  it("takes nothing from a box of blank lines and lookups", () => {
    expect(linesToSave("\n  \n!! caravan\n")).toEqual([]);
  });
});

describe("hasLinesToSave", () => {
  it("is true once a line that isn't a lookup is written", () => {
    expect(hasLinesToSave("?? letter\nTracks lead north")).toBe(true);
  });

  it("is false for an empty box, blank lines or only lookups", () => {
    expect(hasLinesToSave("")).toBe(false);
    expect(hasLinesToSave(" \n\t")).toBe(false);
    expect(hasLinesToSave("?? letter\n!! caravan\n$$ rope")).toBe(false);
  });
});

describe("lookupLinesLeft", () => {
  it("keeps only the lookup lines, as typed", () => {
    expect(lookupLinesLeft(DRAFT)).toBe("?? letter\n$$ lantern");
  });

  it("leaves an empty box when there were no lookups", () => {
    expect(lookupLinesLeft("? Who\nTracks lead north")).toBe("");
  });
});
