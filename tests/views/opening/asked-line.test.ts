import { describe, expect, it } from "vitest";
import { askedLineOf } from "../../../src/views/opening/asked-line";

describe("askedLineOf", () => {
  it.each([0, 7])("reads line %i from what a note was opened with", (line) => {
    expect(askedLineOf({ line })).toBe(line);
  });

  it.each([
    ["nothing", undefined],
    ["no object", 7],
    ["no line", { subpath: "#Notes" }],
    ["a line as text", { line: "7" }],
    ["a line below zero", { line: -1 }],
    ["a line with a fraction", { line: 1.5 }],
  ])("reads no line from %s", (_shape, state) => {
    expect(askedLineOf(state)).toBeNull();
  });
});
