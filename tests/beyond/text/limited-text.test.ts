import { describe, expect, it } from "vitest";
import { LINE_LENGTH, NAME_LENGTH } from "../../../src/beyond/shape/import-limits";
import { Refusal } from "../../../src/beyond/shape/refusal";
import { limitedText } from "../../../src/beyond/text/limited-text";

describe("limitedText", () => {
  it("hands back a name exactly at its limit unchanged", () => {
    const name = "a".repeat(100);
    expect(limitedText(name, NAME_LENGTH)).toBe(name);
  });

  it("refuses a name one over its limit, and does not cut it", () => {
    expect(() => limitedText("a".repeat(101), NAME_LENGTH)).toThrow(new Refusal("A name is over the limit of 100 characters."));
  });

  it("hands back a line exactly at its limit unchanged", () => {
    const line = "a".repeat(300);
    expect(limitedText(line, LINE_LENGTH)).toBe(line);
  });

  it("refuses a line one over its limit", () => {
    expect(() => limitedText("a".repeat(301), LINE_LENGTH)).toThrow(Refusal);
  });

  it("counts an emoji as one character, so 100 emoji pass a limit of 100 characters", () => {
    const names = "\u{1f319}".repeat(100);
    expect(limitedText(names, NAME_LENGTH)).toBe(names);
  });

  it("refuses 101 emoji over a limit of 100 characters", () => {
    expect(() => limitedText("\u{1f319}".repeat(101), NAME_LENGTH)).toThrow(Refusal);
  });

  it("counts a lone surrogate as a character", () => {
    expect(() => limitedText("\ud800".repeat(101), NAME_LENGTH)).toThrow(Refusal);
  });

  it("takes nothing", () => {
    expect(limitedText("", NAME_LENGTH)).toBe("");
  });
});
