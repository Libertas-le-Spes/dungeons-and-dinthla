import { describe, expect, it } from "vitest";
import { BAD_NAME, LONG_NAME, refusalForFileName, RESERVED_NAME } from "../../src/names/file-name";

describe("refusalForFileName", () => {
  it("accepts a plain name", () => {
    expect(refusalForFileName("Silver Road")).toBeNull();
  });

  it("refuses a character a file or a link can't hold", () => {
    for (const name of ["Silver/Road", "Silver:Road", "Silver#Road", "Silver[Road]", "Silver\u0007Road"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("accepts emoji built with joiners, modifiers and presentation selectors", () => {
    const names = [
      "Mira \u{1f9d9}\u200d\u2640\ufe0f",
      "\u{1f468}\u200d\u{1f469}\u200d\u{1f467} Party",
      "\u{1f469}\u{1f3fd}\u200d\u{1f4bb} Coder",
      "\u{1f3f3}\ufe0f\u200d\u{1f308} Banner",
      "\u{1f441}\ufe0f\u200d\u{1f5e8}\ufe0f Witness",
      "\u{1f3f4}\u200d\u2620\ufe0f Crew",
    ];
    for (const name of names) expect(refusalForFileName(name)).toBeNull();
  });

  it("accepts the flags of England, Scotland and Wales", () => {
    const flags = [
      "\u{1f3f4}\u{e0067}\u{e0062}\u{e0065}\u{e006e}\u{e0067}\u{e007f}",
      "\u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074}\u{e007f}",
      "\u{1f3f4}\u{e0067}\u{e0062}\u{e0077}\u{e006c}\u{e0073}\u{e007f}",
    ];
    for (const flag of flags) expect(refusalForFileName(`Highlands ${flag}`)).toBeNull();
  });

  it("refuses a joiner between two letters", () => {
    for (const name of ["Ali\u200dce", "Ali\u200cce"]) expect(refusalForFileName(name)).toBe(BAD_NAME);
  });

  it("refuses a joiner at the start, at the end, or two in a row", () => {
    for (const name of ["\u200d\u{1f9d9}", "\u{1f9d9}\u200d", "\u{1f468}\u200d\u200d\u{1f469}"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a joiner leaning on an invisible character between letters", () => {
    for (const name of ["Ali\ufe0f\u200dce", "Ali\u034f\u200dce", "Ali\u3164\u200dce"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a joiner after a skin tone that follows no emoji", () => {
    expect(refusalForFileName("Ali\u{1f3fd}\u200d\u{1f4bb}")).toBe(BAD_NAME);
  });

  it("refuses any invisible character other than the joiner between two emoji", () => {
    for (const name of ["\u{1f9d9}\u200c\u{1f9d9}", "\u{1f9d9}\u200b\u{1f9d9}", "\u{1f9d9}\u2060\u{1f9d9}"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a presentation selector that doesn't follow an emoji", () => {
    expect(refusalForFileName("Ali\ufe0fce")).toBe(BAD_NAME);
  });

  it("refuses invisible characters that aren't formatting characters, such as a Hangul filler or a variation selector", () => {
    for (const name of ["Ali\u3164ce", "Ali\u034fce", "Ali\u180bce", "Ali\u{e0100}ce", "Ali\u{e0080}ce"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses any other invisible formatting character, such as a text direction override, a zero-width space or a byte order mark", () => {
    for (const name of ["Mira\u202eRoad", "Mira\u200bRoad", "\ufeffMira"]) {
      expect(refusalForFileName(name)).toBe(BAD_NAME);
    }
  });

  it("refuses a black flag with made-up or uppercase tags, as each would draw as the same flag", () => {
    const flags = [
      "\u{1f3f4}\u{e0078}\u{e0079}\u{e007a}\u{e007f}",
      "\u{1f3f4}\u{e0047}\u{e0042}\u{e0053}\u{e0043}\u{e0054}\u{e007f}",
      "\u{1f3f4}\u{e0001}\u{e007f}",
      "\u{1f3f4}\u{e001f}\u{e007f}",
    ];
    for (const flag of flags) expect(refusalForFileName(`Highlands ${flag}`)).toBe(BAD_NAME);
  });

  it("refuses tag characters that don't follow the black flag", () => {
    expect(refusalForFileName("Mira\u{e0067}\u{e0062}\u{e007f}")).toBe(BAD_NAME);
  });

  it("refuses a black flag whose tag characters never end", () => {
    expect(refusalForFileName("\u{1f3f4}\u{e0067}\u{e0062}\u{e0073}\u{e0063}\u{e0074} Road")).toBe(BAD_NAME);
  });

  it("refuses a name holding half of a character", () => {
    expect(refusalForFileName("Mira\ud83e")).toBe(BAD_NAME);
  });

  it("refuses every control character, including the C1 controls, and line breaks", () => {
    for (const name of ["Mi\u0085ra", "Mi\u0080ra", "Mi\u009fra", "Mi\u2028ra", "Mi\u2029ra"]) {
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
