import { describe, expect, it } from "vitest";
import { withEscapedCharacters } from "../../../src/imports/layout/character-escapes";

const ESCAPES = [
  { name: "a backslash", written: "a\\b", escaped: "a\\\\b" },
  { name: "an opening square bracket", written: "a[b", escaped: "a\\[b" },
  { name: "a closing square bracket", written: "a]b", escaped: "a\\]b" },
  { name: "a backtick", written: "a`b", escaped: "a\\`b" },
  { name: "a less-than sign", written: "a<b", escaped: "a\\<b" },
  { name: "a greater-than sign", written: "a>b", escaped: "a\\>b" },
  { name: "a pipe", written: "a|b", escaped: "a\\|b" },
  { name: "a hash", written: "a#b", escaped: "a\\#b" },
  { name: "an asterisk", written: "a*b", escaped: "a\\*b" },
  { name: "an underscore", written: "a_b", escaped: "a\\_b" },
  { name: "a dollar sign", written: "a$b", escaped: "a\\$b" },
  { name: "a caret", written: "a^b", escaped: "a\\^b" },
  { name: "a pair of percent signs", written: "a%%b", escaped: "a\\%\\%b" },
  { name: "a pair of equals signs", written: "a==b", escaped: "a\\=\\=b" },
  { name: "a pair of tildes", written: "a~~b", escaped: "a\\~\\~b" },
  { name: "a pair of colons", written: "a::b", escaped: "a\\:\\:b" },
];

describe("withEscapedCharacters", () => {
  it.each(ESCAPES)("escapes $name", ({ written, escaped }) => {
    expect(withEscapedCharacters(written)).toBe(escaped);
  });

  it("leaves a lone percent sign, equals sign and colon as they are", () => {
    expect(withEscapedCharacters("50% a=b 12:30")).toBe("50% a=b 12:30");
  });

  it("leaves plain words as they are", () => {
    expect(withEscapedCharacters("Primary Monk, Human (Pale Moon)")).toBe("Primary Monk, Human (Pale Moon)");
  });

  it("escapes the backslash before every other escape, so the backslash an escape adds is not doubled", () => {
    expect(withEscapedCharacters("\\[")).toBe("\\\\\\[");
  });

  it("leaves no link, embed or comment opener in what it makes", () => {
    const made = withEscapedCharacters("[[Mira]] ![[Pale Moon]] %% hidden %%");
    expect(made).toBe("\\[\\[Mira\\]\\] !\\[\\[Pale Moon\\]\\] \\%\\% hidden \\%\\%");
  });

  it("escapes the backtick of Dataview's inline form", () => {
    expect(withEscapedCharacters("`= this.file.name`")).toBe("\\`= this.file.name\\`");
  });

  it("escapes the dollar sign of Dataview's inline script form", () => {
    expect(withEscapedCharacters("`$= dv.pages()`")).toBe("\\`\\$= dv.pages()\\`");
  });

  it("escapes the brackets and colons of a Dataview inline field", () => {
    expect(withEscapedCharacters("[range:: 60 feet]")).toBe("\\[range\\:\\: 60 feet\\]");
  });

  it("escapes every one of a run of equals signs", () => {
    expect(withEscapedCharacters("====")).toBe("\\=\\=\\=\\=");
  });
});
