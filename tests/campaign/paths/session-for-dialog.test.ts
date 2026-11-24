import { describe, expect, it } from "vitest";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { sessionForDialog } from "../../../src/campaign/paths/session-for-dialog";
import { latestSessionWanted, SESSIONS_SHARE_A_NUMBER } from "../../../src/campaign/paths/session-to-write";
import { RecordedTelling } from "../../host/showing/recorded-telling";

const NO_SESSION = "Start a session first.";
const LATEST = latestSessionWanted(NO_SESSION);

function filesAt(paths: string[]) {
  const files = paths.map((path) => ({ path }) as NoteRef);
  return { files: () => files };
}

describe("sessionForDialog", () => {
  it("gives the session to write in and says nothing", () => {
    const files = filesAt(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md"]);
    const telling = new RecordedTelling();
    expect(sessionForDialog(files, telling, "Pale Moon", LATEST)).toBe("Pale Moon/Sessions/Session 2.md");
    expect(telling.said).toEqual([]);
  });

  it("says the caller's words and gives nothing when the campaign has no session", () => {
    const telling = new RecordedTelling();
    expect(sessionForDialog(filesAt(["Pale Moon/Pale Moon.md"]), telling, "Pale Moon", LATEST)).toBeNull();
    expect(telling.said).toEqual([NO_SESSION]);
  });

  it("says the sessions share a number and gives nothing when two share the latest", () => {
    const files = filesAt(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 01.md"]);
    const telling = new RecordedTelling();
    expect(sessionForDialog(files, telling, "Pale Moon", LATEST)).toBeNull();
    expect(telling.said).toEqual([SESSIONS_SHARE_A_NUMBER]);
  });
});
