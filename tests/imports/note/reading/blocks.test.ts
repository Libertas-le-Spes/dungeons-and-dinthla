import { describe, expect, it } from "vitest";
import { BlockTracker } from "../../../../src/imports/note/reading/blocks/block-tracker";

function allowedAmong(lines: readonly string[]): boolean[] {
  const tracker = new BlockTracker();
  const allowed: boolean[] = [];
  for (const line of lines) allowed.push(tracker.allowsHeading(line));
  return allowed;
}

function closedAfter(lines: readonly string[]): boolean {
  const tracker = new BlockTracker();
  for (const line of lines) tracker.allowsHeading(line);
  return tracker.isClosed();
}

describe("BlockTracker", () => {
  it("allows a heading on a line of plain text", () => {
    expect(allowedAmong(["a", "b"])).toEqual([true, true]);
  });

  it("allows nothing from the line after a fence opens to the line of its close, and then allows again", () => {
    expect(allowedAmong(["```", "x", "```", "y"])).toEqual([true, false, false, true]);
  });

  it("allows nothing inside a comment, and allows again after it closes", () => {
    expect(allowedAmong(["<!--", "x", "-->", "y"])).toEqual([true, false, false, true]);
  });

  it("allows nothing inside a percent comment, and allows again after it closes", () => {
    expect(allowedAmong(["%%", "x", "%%", "y"])).toEqual([true, false, false, true]);
  });

  it("is closed after text, a closed block and a closed comment", () => {
    expect(closedAfter(["a", "```", "x", "```", "<!-- x -->", "%% y %%"])).toBe(true);
  });

  it("is not closed after an open fence", () => {
    expect(closedAfter(["```", "x"])).toBe(false);
  });

  it("is not closed after an open HTML comment", () => {
    expect(closedAfter(["a <!-- b"])).toBe(false);
  });

  it("is not closed after an open percent comment", () => {
    expect(closedAfter(["a %% b"])).toBe(false);
  });

  it("takes the comment that opens first when a line has both kinds", () => {
    expect(closedAfter(["%% a <!-- b %% c"])).toBe(true);
    expect(closedAfter(["<!-- a %% b -->"])).toBe(true);
  });

  it("stays inside a comment of one kind when the other kind's closer shows", () => {
    expect(closedAfter(["<!-- a %% b"])).toBe(false);
    expect(closedAfter(["%% a --> b"])).toBe(false);
  });

  it("is closed again at the start, before any line", () => {
    expect(closedAfter([])).toBe(true);
  });
});
