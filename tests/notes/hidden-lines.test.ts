import { describe, expect, it } from "vitest";
import { hiddenLines } from "../../src/notes/hidden-lines";

function hidden(lines: string[]): number[] {
  return [...hiddenLines(lines.join("\n"))];
}

describe("hiddenLines", () => {
  it("hides a code block with its fences", () => {
    expect(hidden(["a", "```", "speed: 30 ft.", "```", "b"])).toEqual([1, 2, 3]);
  });

  it("ends a code block only at a fence of the same kind, at least as long", () => {
    expect(hidden(["~~~", "```", "~~", "~~~~", "a"])).toEqual([0, 1, 2, 3]);
    expect(hidden(["````", "```", "````", "a"])).toEqual([0, 1, 2]);
  });

  it("hides a comment across lines, with its marks", () => {
    expect(hidden(["a", "%%", "speed: 30 ft.", "%%", "b"])).toEqual([1, 2, 3]);
  });

  it("hides a line with a comment inside it, and nothing after", () => {
    expect(hidden(["a %% aside %% b", "c"])).toEqual([0]);
  });

  it("leaves comment marks inside a code block alone", () => {
    expect(hidden(["```", "%%", "```", "a"])).toEqual([0, 1, 2]);
  });

  it("hides nothing in plain lines", () => {
    expect(hidden(["a", "b"])).toEqual([]);
  });
});
