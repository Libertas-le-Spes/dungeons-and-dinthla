import { afterEach, describe, expect, it, vi } from "vitest";
import { LineTally } from "../../../../src/beyond/sheet/lines/line-tally";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { textsOf } from "../../builders/sheet-reading";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a tally of lines from the sheet", () => {
  it("keeps a usable line and gives it back", () => {
    const tally = new LineTally();
    expect(tally.take("Primary Rope")?.text).toBe("Primary Rope");
    expect(textsOf(tally.lines())).toEqual(["Primary Rope"]);
  });

  it("counts nothing lost for a blank line, however it is blank", () => {
    const tally = new LineTally();
    for (const blank of ["", "   ", "​", "\u0007\u000b"]) expect(tally.take(blank)).toBeNull();
    expect(tally.loss()).toEqual({ tooLong: 0, notClean: 0 });
  });

  it("keeps a line of exactly 100 characters", () => {
    const tally = new LineTally();
    tally.take("x".repeat(100));
    expect([tally.lines().length, tally.loss()]).toEqual([1, { tooLong: 0, notClean: 0 }]);
  });

  it.each([101, 300, 301, 5000])("counts a line of %i characters as too long, and keeps nothing", (length) => {
    const tally = new LineTally();
    tally.take("x".repeat(length));
    expect([tally.lines().length, tally.loss()]).toEqual([0, { tooLong: 1, notClean: 0 }]);
  });

  it("counts a line that markup makes short enough as kept", () => {
    const tally = new LineTally();
    tally.take(`<b>${"x".repeat(90)}</b>`);
    expect(tally.loss()).toEqual({ tooLong: 0, notClean: 0 });
  });

  it("counts a line that is only markup as not clean", () => {
    const tally = new LineTally();
    tally.take("<br>");
    expect(tally.loss()).toEqual({ tooLong: 0, notClean: 1 });
  });

  it("counts a line with a line break inside as not clean", () => {
    const tally = new LineTally();
    tally.take("two\nlines");
    expect(tally.loss()).toEqual({ tooLong: 0, notClean: 1 });
  });

  it("splits a text into lines and counts each kind of loss once per line", () => {
    const tally = new LineTally();
    tally.takeLinesOf(`One\n\n${"x".repeat(101)}\n<br>\n${"y".repeat(301)}\nTwo`);
    expect([textsOf(tally.lines()), tally.loss()]).toEqual([["One", "Two"], { tooLong: 2, notClean: 1 }]);
  });

  it("asks the line guard nothing for a line that is blank or too long", () => {
    const guard = vi.spyOn(CleanLine, "of");
    const tally = new LineTally();
    tally.takeLinesOf(`${"\n".repeat(1000)}${"x".repeat(500)}`);
    expect(guard).not.toHaveBeenCalled();
  });
});
