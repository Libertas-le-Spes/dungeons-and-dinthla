import { describe, expect, it } from "vitest";
import { keptBeyondNumberOf } from "../../../../src/imports/note/reading/kept-beyond-number";

describe("the D&D Beyond number a note keeps", () => {
  it.each([
    ["a number written by the import", "---\nimported-from: online\nbeyond: 12345678\n---\nHis words.\n", "12345678"],
    ["the longest number D&D Beyond could give", "---\nbeyond: 999999999999\n---\n", "999999999999"],
    ["Windows line endings", "---\r\nbeyond: 12345678\r\n---\r\n", "12345678"],
  ])("is read from %s", (_case, text, kept) => {
    expect(keptBeyondNumberOf(text)).toBe(kept);
  });

  it.each([
    ["no properties", "His words.\n"],
    ["no beyond property", "---\nimported-from: pdf\n---\n"],
    ["a blank number", "---\nbeyond:\n---\n"],
    ["a number starting with 0", "---\nbeyond: 0123\n---\n"],
    ["a number too long for D&D Beyond", "---\nbeyond: 1234567890123\n---\n"],
    ["a quoted number", '---\nbeyond: "12345678"\n---\n'],
    ["a whole link", "---\nbeyond: https://www.dndbeyond.com/characters/12345678\n---\n"],
    ["another address", "---\nbeyond: 12345678@elsewhere.example\n---\n"],
    ["a properties block that never closes", "---\nbeyond: 12345678\n"],
    ["a note the import refuses, with its Numbers section twice", "---\nbeyond: 12345678\n---\n## Numbers\n## Numbers\n"],
  ])("is none for %s", (_case, text) => {
    expect(keptBeyondNumberOf(text)).toBeNull();
  });
});
