import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { RecordChange } from "../../../src/campaign/changes/record-change";
import { writeInSession } from "../../../src/campaign/changes/write-in-session";

const SEVEN = "Pale Moon/Sessions/Session 7.md";

function change(): RecordChange<string> {
  return { plan: () => "wick", checks: [], sessionChangeOf: () => ({ removal: null, added: { path: SEVEN, lines: ["$ Candle"], later: null } }) };
}

function setUp(sessionHeld: boolean) {
  const files = {
    getFileByPath: (path: string) => {
      if (sessionHeld) return { path } as TFile;
      return null;
    },
  };
  const writer = { apply: vi.fn(async () => true) };
  const changeOf = vi.fn(change);
  return { files, writer, changeOf };
}

describe("writeInSession", () => {
  it("writes the change when the session's note is there", async () => {
    const { files, writer, changeOf } = setUp(true);
    expect(await writeInSession(files, SEVEN, changeOf, writer)).toBe(true);
    expect(writer.apply).toHaveBeenCalledTimes(1);
  });

  it("refuses with the session gone words, before building the change or writing, when the session's note is gone", async () => {
    const { files, writer, changeOf } = setUp(false);
    await expect(writeInSession(files, SEVEN, changeOf, writer)).rejects.toThrow("Session 7's note is gone, so nothing was written.");
    expect(changeOf).not.toHaveBeenCalled();
    expect(writer.apply).not.toHaveBeenCalled();
  });
});
