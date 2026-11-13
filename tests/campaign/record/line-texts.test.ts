import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { lineTextsOf } from "../../../src/campaign/record/line-texts";

function sessionWith(text: string, path = "Pale Moon/Sessions/Session 1.md"): SessionNote {
  return { path, number: 1, text, firstLine: 0 };
}

describe("lineTextsOf", () => {
  it("gives the lines of the session at the sources, in note order, once each", () => {
    const session = sessionWith("zero\n? one\ntwo\n$ three");
    const sources = [3, 1, 1].map((line) => ({ path: session.path, line }));
    expect(lineTextsOf(session, sources)).toEqual(["? one", "$ three"]);
  });

  it("leaves out the bullet and the indentation", () => {
    const session = sessionWith("  - ? one\n* $ two");
    const sources = [0, 1].map((line) => ({ path: session.path, line }));
    expect(lineTextsOf(session, sources)).toEqual(["? one", "$ two"]);
  });

  it("leaves out the carriage return a Windows line ends in", () => {
    const session = sessionWith("? one\r\n$ two\r\n");
    const sources = [0, 1].map((line) => ({ path: session.path, line }));
    expect(lineTextsOf(session, sources)).toEqual(["? one", "$ two"]);
  });

  it("leaves out the sources of other sessions", () => {
    const session = sessionWith("? one\n? two");
    const sources = [{ path: "Pale Moon/Sessions/Session 2.md", line: 0 }, { path: session.path, line: 1 }];
    expect(lineTextsOf(session, sources)).toEqual(["? two"]);
  });

  it("gives nothing for a source past the end of the session", () => {
    const session = sessionWith("? one");
    expect(lineTextsOf(session, [{ path: session.path, line: 5 }])).toEqual([]);
  });
});
