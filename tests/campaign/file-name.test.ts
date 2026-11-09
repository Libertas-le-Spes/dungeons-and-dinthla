import { describe, expect, it } from "vitest";
import { BAD_NAME, LONG_NAME, refusalForFileName, RESERVED_NAME } from "../../src/campaign/file-name";

describe("refusalForFileName", () => {
  it("accepts a plain name", () => {
    expect(refusalForFileName("Silver Road")).toBeNull();
  });

  it("refuses a character a file or a link can't hold", () => {
    for (const name of ["Silver/Road", "Silver:Road", "Silver#Road", "Silver[Road]", "Silver\u0007Road"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses an invisible formatting character, such as a zero-width space", () => {
    for (const name of ["Silver\u200bRoad", "Silver\u200dRoad", "\ufeffSilver Road"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a name that starts or ends with a dot or a space", () => {
    for (const name of [".Silver", "Silver.", " Silver", "Silver "]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a name Windows keeps for itself, even with more after a dot", () => {
    for (const name of ["CON", "nul", "com1", "LPT²", "aux.notes"]) {
      expect(refusalForFileName(name)).toBe(RESERVED_NAME);
    }
  });

  it("refuses a name too long for a note's file", () => {
    expect(refusalForFileName("é".repeat(127))).toBe(LONG_NAME);
  });
});
