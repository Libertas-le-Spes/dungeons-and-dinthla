import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { refuseIfSessionGone, sessionGoneWords } from "../../../src/campaign/paths/session-gone";

const SEVEN = "Pale Moon/Sessions/Session 7.md";

function filesHolding(held: string[]) {
  return {
    getFileByPath: vi.fn((path: string) => {
      if (held.includes(path)) return { path } as TFile;
      return null;
    }),
  };
}

describe("sessionGoneWords", () => {
  it("names the session and says nothing was written", () => {
    expect(sessionGoneWords(SEVEN)).toBe("Session 7's note is gone, so nothing was written.");
  });
});

describe("refuseIfSessionGone", () => {
  it("refuses with the words when the session's note is gone", () => {
    expect(() => refuseIfSessionGone(filesHolding([]), SEVEN)).toThrow(new Error("Session 7's note is gone, so nothing was written."));
  });

  it("asks the files for that one path", () => {
    const files = filesHolding([]);
    expect(() => refuseIfSessionGone(files, SEVEN)).toThrow();
    expect(files.getFileByPath.mock.calls).toEqual([[SEVEN]]);
  });

  it("says nothing when the session's note is there", () => {
    expect(() => refuseIfSessionGone(filesHolding([SEVEN]), SEVEN)).not.toThrow();
  });
});
