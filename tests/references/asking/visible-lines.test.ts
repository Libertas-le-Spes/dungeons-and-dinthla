import { describe, expect, it } from "vitest";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { visibleLinesOf } from "../../../src/references/asking/visible-lines";

function visible(text: string): string[] {
  return visibleLinesOf(sessionNoteOf("Pale Moon/Sessions/Session 1.md", 1, text));
}

describe("visibleLinesOf", () => {
  it("leaves out the properties and keeps the other lines in order", () => {
    expect(visible("---\nrole: dm\n---\none\ntwo")).toEqual(["one", "two"]);
  });

  it.each([
    ["backticks", "```", ["a", "", "", "", "b"]],
    ["tildes", "~~~", ["a", "", "", "", "b"]],
  ])("blanks a code block fenced with %s, its fences included", (_name, fence, expected) => {
    expect(visible(["a", `${fence}js`, "[[Hidden]]", fence, "b"].join("\n"))).toEqual(expected);
  });

  it("keeps a code block open until its own kind of fence", () => {
    expect(visible(["~~~", "```", "[[Hidden]]", "~~~", "b"].join("\n"))).toEqual(["", "", "", "", "b"]);
  });

  it("blanks a code block left open to the end", () => {
    expect(visible(["```", "[[Hidden]]"].join("\n"))).toEqual(["", ""]);
  });

  it("removes code written in a line", () => {
    expect(visible("see `[[Hidden]]` and [[Shown]]")).toEqual(["see  and [[Shown]]"]);
  });

  it.each([
    ["in a line", "a %%[[Hidden]]%% b", ["a  b"]],
    ["over lines", "a %%\n[[Hidden]]\n%% b", ["a ", "", " b"]],
    ["to the end", "a %% [[Hidden]]\n[[Hidden]]", ["a ", ""]],
  ])("removes a comment %s", (_name, text, expected) => {
    expect(visible(text)).toEqual(expected);
  });

  it("reads a fence inside a comment as comment, not as a code block", () => {
    expect(visible(["%%", "```", "%%", "[[Shown]]"].join("\n"))).toEqual(["", "", "", "[[Shown]]"]);
  });
});
