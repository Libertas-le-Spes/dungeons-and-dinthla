import { describe, expect, it } from "vitest";
import { nameTextOf } from "../../../src/beyond/text/name-text";

describe("nameTextOf", () => {
  it("leaves a plain name as it is", () => {
    expect(nameTextOf("Primary Monk")).toBe("Primary Monk");
  });

  it("takes a name exactly at the name cap", () => {
    expect(nameTextOf("a".repeat(100))).toBe("a".repeat(100));
  });

  it("refuses a name one over the name cap", () => {
    expect(() => nameTextOf("a".repeat(101))).toThrow("A name is over the limit of 100 characters.");
  });

  it("refuses text over the line cap before reading it any further", () => {
    expect(() => nameTextOf(`<b>${"a".repeat(300)}</b>`)).toThrow("A line of text is over the limit of 300 characters.");
  });

  it("removes tags before counting against the name cap", () => {
    expect(nameTextOf(`<b>${"a".repeat(100)}</b>`)).toBe("a".repeat(100));
  });

  it("removes a tag and keeps its text", () => {
    expect(nameTextOf("<b>Mira</b> Pale")).toBe("Mira Pale");
  });

  it("makes the text inert for a note", () => {
    expect(nameTextOf("[[Mira]]")).toBe("\\[\\[Mira\\]\\]");
  });

  it("refuses a name with a line break", () => {
    expect(() => nameTextOf("Mira\nPale")).toThrow("A value that has to be on one line holds a line break.");
  });

  it.each(["", "   ", "<b></b>", "​"])("refuses %j as a name with no text in it", (written) => {
    expect(() => nameTextOf(written)).toThrow("A name has no text in it.");
  });
});
