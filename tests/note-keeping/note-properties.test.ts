import { describe, expect, it } from "vitest";
import { linesIn, sameLines, sessionPropertyIn } from "../../src/note-keeping/note-properties";

function propertiesOf(properties: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (properties === undefined) return null;
  return properties;
}

describe("linesIn", () => {
  it("is the list of lines the note holds", () => {
    expect(linesIn(propertiesOf({ lines: ["? One", "$ Two"] }))).toEqual(["? One", "$ Two"]);
  });

  it("is an empty list for a note with no properties, no lines or an empty value", () => {
    expect(linesIn(propertiesOf(undefined))).toEqual([]);
    expect(linesIn(propertiesOf({}))).toEqual([]);
    expect(linesIn(propertiesOf({ lines: null }))).toEqual([]);
  });

  it("is nothing for lines that aren't a list of texts", () => {
    expect(linesIn(propertiesOf({ lines: "? One" }))).toBeNull();
    expect(linesIn(propertiesOf({ lines: ["? One", 2] }))).toBeNull();
  });
});

describe("sessionPropertyIn", () => {
  it("is what the session property holds, or nothing", () => {
    expect(sessionPropertyIn(propertiesOf({ session: "[[Session 2]]" }))).toBe("[[Session 2]]");
    expect(sessionPropertyIn(propertiesOf({}))).toBeUndefined();
    expect(sessionPropertyIn(propertiesOf(undefined))).toBeUndefined();
  });
});

describe("sameLines", () => {
  it("is true for the same lines in the same order", () => {
    expect(sameLines(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("is false for other lines, other order, or lines that couldn't be read", () => {
    expect(sameLines(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameLines(["a"], ["a", "b"])).toBe(false);
    expect(sameLines(null, [])).toBe(false);
  });
});
