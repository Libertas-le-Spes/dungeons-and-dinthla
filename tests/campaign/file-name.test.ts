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

  it("accepts emoji and words joined by invisible joiners", () => {
    for (const name of ["Mira \u{1f9d9}\u200d\u2640\ufe0f", "\u{1f468}\u200d\u{1f469}\u200d\u{1f467} Party", "Ali\u200creza"]) {
      expect(refusalForFileName(name)).toBeNull();
    }
  });

  it("accepts a flag written with tag characters, such as Scotland's", () => {
    expect(refusalForFileName("\u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}")).toBeNull();
  });

  it("refuses a joiner at the start, at the end, or two in a row", () => {
    for (const name of ["\u200dMira", "Mira\u200d", "\u200cMira", "Mi\u200d\u200dra", "Mi\u200c\u200dra"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a joiner next to a space", () => {
    for (const name of ["Mira \u200dRoad", "Mira\u200d Road"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses any other invisible formatting character, such as a text direction override, a zero-width space or a byte order mark", () => {
    for (const name of ["Mira\u202eRoad", "Mira\u200bRoad", "\ufeffMira"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses tag characters that don't follow the black flag", () => {
    expect(refusalForFileName("Mira\u{e0067}\u{e0062}\u{e007f}")).toBe(BAD_NAME);
  });

  it("refuses a black flag whose tag characters never end", () => {
    expect(refusalForFileName("\u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074} Road")).toBe(BAD_NAME);
  });

  it("refuses a black flag with only the ending tag", () => {
    expect(refusalForFileName("\u{1f3f4}\u{e007f} Road")).toBe(BAD_NAME);
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
