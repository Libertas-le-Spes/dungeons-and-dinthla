import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { RecordChange } from "../../../src/campaign/changes/record-change";
import { OpenedSession } from "../../../src/campaign/paths/session-gone";
import { writeInSession } from "../../../src/campaign/changes/write-in-session";

const SEVEN = "Pale Moon/Sessions/Session 7.md";

function change(): RecordChange<string> {
  return { plan: () => "wick", checks: [], sessionChangeOf: () => ({ removal: null, added: { path: SEVEN, lines: ["$ Candle"], later: null } }) };
}

function setUp(sessionHeld: boolean) {
  const held = { path: SEVEN } as TFile;
  const files = {
    getFileByPath: (path: string) => {
      if (sessionHeld) return held;
      return null;
    },
  };
  const writer = { apply: vi.fn(async () => true) };
  const changeOf = vi.fn(change);
  return { session: new OpenedSession(files, SEVEN), writer, changeOf };
}

describe("writeInSession", () => {
  it("writes the change when the session's note is there", async () => {
    const { session, writer, changeOf } = setUp(true);
    expect(await writeInSession(session, changeOf, writer)).toBe(true);
    expect(writer.apply).toHaveBeenCalledTimes(1);
  });

  it("refuses with the session gone words, before building the change or writing, when the session's note is gone", async () => {
    const { session, writer, changeOf } = setUp(false);
    await expect(writeInSession(session, changeOf, writer)).rejects.toThrow("Session 7 was moved or deleted, so nothing was written.");
    expect(changeOf).not.toHaveBeenCalled();
    expect(writer.apply).not.toHaveBeenCalled();
  });
});
