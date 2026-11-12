import { describe, expect, it } from "vitest";
import { expectWord, hasWord, skipWord } from "../../../src/pdf/bytes/expect-word";
import { cursorOver } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

describe("hasWord", () => {
  it("finds a word that ends at whitespace, a delimiter or the end", () => {
    for (const text of ["obj ", "obj<<", "obj"]) expect(hasWord(cursorOver(text), "obj")).toBe(true);
  });

  it("does not find a word that runs on into more letters", () => {
    expect(hasWord(cursorOver("object"), "obj")).toBe(false);
  });

  it("does not find a different word", () => {
    expect(hasWord(cursorOver("endobj"), "obj")).toBe(false);
  });
});

describe("expectWord", () => {
  it("moves past the word it finds", () => {
    const cursor = cursorOver("obj 5");
    expectWord(cursor, "obj", "no obj");
    expect(cursor.position()).toBe(3);
  });

  it("refuses with the words it was given when the word is not there", () => {
    expect(refusalFrom(() => expectWord(cursorOver("xyz"), "obj", "no obj here"))).toBe("no obj here");
  });
});

describe("skipWord", () => {
  it("moves past exactly the length of the word", () => {
    const cursor = cursorOver("abcdef");
    skipWord(cursor, "abc");
    expect(cursor.position()).toBe(3);
  });
});
