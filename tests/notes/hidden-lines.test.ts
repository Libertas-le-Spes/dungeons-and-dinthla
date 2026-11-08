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

  it("doesn't end a code block at a fence with words after it", () => {
    expect(hidden(["```", "a", "```js", "b", "```", "c"])).toEqual([0, 1, 2, 3, 4]);
  });

  it("starts after the note's properties, so a comment mark there changes nothing", () => {
    expect(hidden(["---", "note: 50%%", "---", "a", "b"])).toEqual([]);
  });

  it("ignores comment marks inside inline code", () => {
    expect(hidden(["Type `%%` to hide", "a"])).toEqual([]);
  });

  it("hides an indented code block at the start or after a blank line", () => {
    expect(hidden(["    code", "a", "", "\tcode", "", "    more", "b"])).toEqual([0, 3, 5]);
  });

  it("keeps an indented code block going line after line", () => {
    expect(hidden(["", "    one", "    two", "three"])).toEqual([1, 2]);
  });

  it("doesn't take an indented line straight after text for code", () => {
    expect(hidden(["a", "    still a"])).toEqual([]);
  });

  it("starts an indented code block after a code block", () => {
    expect(hidden(["a", "```", "x", "```", "    code"])).toEqual([1, 2, 3, 4]);
  });

  it("doesn't start an indented code block after a comment", () => {
    expect(hidden(["", "%% aside %%", "    still text"])).toEqual([1]);
  });

  it("hides an HTML comment across lines", () => {
    expect(hidden(["a", "<!-- old", "speed: 30 ft.", "-->", "b"])).toEqual([1, 2, 3]);
  });

  it("hides a math block across lines", () => {
    expect(hidden(["a", "$$", "x: 2", "$$", "b"])).toEqual([1, 2, 3]);
  });

  it("opens the block whose mark comes first on the line", () => {
    expect(hidden(["a $$ b %% c", "x $$", "y"])).toEqual([0, 1]);
  });

  it("ends a block only at its own mark", () => {
    expect(hidden(["<!--", "%%", "-->", "a"])).toEqual([0, 1, 2]);
  });

  it("hides nothing in plain lines", () => {
    expect(hidden(["a", "b"])).toEqual([]);
  });
});
