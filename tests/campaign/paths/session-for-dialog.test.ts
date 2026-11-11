import { beforeEach, describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { sessionForDialog } from "../../../src/campaign/paths/session-for-dialog";
import { latestSessionWanted, SESSIONS_SHARE_A_NUMBER } from "../../../src/campaign/paths/session-to-write";
import { Notice } from "../../stubs/obsidian";

const NO_SESSION = "Start a session first.";
const LATEST = latestSessionWanted(NO_SESSION);

function filesAt(paths: string[]) {
  const files = paths.map((path) => ({ path }) as TFile);
  return { getFiles: () => files };
}

beforeEach(() => {
  Notice.shown = [];
});

describe("sessionForDialog", () => {
  it("gives the session to write in and says nothing", () => {
    const files = filesAt(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md"]);
    expect(sessionForDialog(files, "Pale Moon", LATEST)).toBe("Pale Moon/Sessions/Session 2.md");
    expect(Notice.shown).toEqual([]);
  });

  it("says the caller's words and gives nothing when the campaign has no session", () => {
    expect(sessionForDialog(filesAt(["Pale Moon/Pale Moon.md"]), "Pale Moon", LATEST)).toBeNull();
    expect(Notice.shown).toEqual([NO_SESSION]);
  });

  it("says the sessions share a number and gives nothing when two share the latest", () => {
    const files = filesAt(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 01.md"]);
    expect(sessionForDialog(files, "Pale Moon", LATEST)).toBeNull();
    expect(Notice.shown).toEqual([SESSIONS_SHARE_A_NUMBER]);
  });
});
