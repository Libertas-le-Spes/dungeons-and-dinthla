import { describe, expect, it } from "vitest";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { movesWords, reportWordsOf, type RenumberingReport } from "../../../src/session-notes/renumbering/renumbering-words";

function rename(from: number, to: number): SessionRename {
  return { from: `Pale Moon/Sessions/Session ${from}.md`, to: `Pale Moon/Sessions/Session ${to}.md`, fromNumber: from, toNumber: to };
}

const CLEAN: RenumberingReport = { renamed: [], notRenamed: [], renameFailure: null, linksNotUpdated: [], linksLeft: [], linksSkipped: [] };

describe("movesWords", () => {
  it("says nothing when no session moves", () => {
    expect(movesWords([])).toBe("");
  });

  it("names one session that moves", () => {
    expect(movesWords([rename(5, 2)])).toBe("Session 5 becomes 2.");
  });

  it("names two sessions that move", () => {
    expect(movesWords([rename(5, 2), rename(7, 3)])).toBe("Sessions 5 and 7 become 2 and 3.");
  });

  it("names every session that moves when more than two do", () => {
    expect(movesWords([rename(4, 3), rename(5, 4), rename(6, 5)])).toBe("Sessions 4, 5 and 6 become 3, 4 and 5.");
  });
});

describe("reportWordsOf", () => {
  it("says nothing when everything was done", () => {
    expect(reportWordsOf({ ...CLEAN, renamed: [rename(5, 2)] })).toBeNull();
  });

  it("says which sessions were renamed and which weren't, and that no link was updated, when a rename failed", () => {
    const report = { ...CLEAN, renamed: [rename(5, 2)], notRenamed: [rename(7, 3), rename(8, 4)], renameFailure: "the disk is full." };
    expect(reportWordsOf(report)).toBe(
      "Numbering the sessions again stopped: the disk is full. Renamed: Session 5 to Session 2. Not renamed: Session 7 to Session 3, Session 8 to Session 4. No links were updated.",
    );
  });

  it("says none when no session was renamed before a rename failed", () => {
    const report = { ...CLEAN, notRenamed: [rename(5, 2)], renameFailure: "the disk is full." };
    expect(reportWordsOf(report)).toBe("Numbering the sessions again stopped: the disk is full. Renamed: none. Not renamed: Session 5 to Session 2. No links were updated.");
  });

  it("says in which notes links weren't updated", () => {
    const report = { ...CLEAN, linksNotUpdated: ["Pale Moon/Notes.md", "D&D/Ideas.md"] };
    expect(reportWordsOf(report)).toBe("Links weren't updated in: Pale Moon/Notes.md, D&D/Ideas.md.");
  });

  it("says which notes had links left as written because more than one campaign has that session", () => {
    const report = { ...CLEAN, linksLeft: ["D&D/Ideas.md"] };
    expect(reportWordsOf(report)).toBe("These notes link to a Session that more than one campaign has, so those links were left as written: D&D/Ideas.md.");
  });

  it("says in which notes a link to a session that moved sits on a line that isn't rewritten", () => {
    const report = { ...CLEAN, linksSkipped: ["Pale Moon/Notes.md"] };
    expect(reportWordsOf(report)).toBe(
      "These notes still link to a session that moved on a line that isn't rewritten (properties, code, a comment, math or an indented list), so the link keeps its old number: Pale Moon/Notes.md.",
    );
  });

  it("says both about links when both happened", () => {
    const report = { ...CLEAN, linksNotUpdated: ["Pale Moon/Notes.md"], linksLeft: ["D&D/Ideas.md"] };
    expect(reportWordsOf(report)).toBe(
      "Links weren't updated in: Pale Moon/Notes.md. These notes link to a Session that more than one campaign has, so those links were left as written: D&D/Ideas.md.",
    );
  });
});
