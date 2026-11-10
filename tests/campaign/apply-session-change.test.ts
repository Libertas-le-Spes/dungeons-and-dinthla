import { describe, expect, it } from "vitest";
import { applySessionChange } from "../../src/campaign/apply-session-change";
import type { SessionNote } from "../../src/campaign/campaign";
import type { Removal } from "../../src/campaign/note-editor";
import type { SessionChange } from "../../src/campaign/session-change";
import { sessionNoteOf } from "../../src/campaign/session-file";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function sessions(one: string, two: string): SessionNote[] {
  return [sessionNoteOf(ONE, 1, one), sessionNoteOf(TWO, 2, two)];
}

function lineAt(path: string, line: number, text: string): Removal {
  return { path, line, matches: (written) => written === text };
}

const NOTHING: SessionChange = { removal: null, added: null };

function textsAfter(notes: SessionNote[], change: SessionChange): string[] {
  return applySessionChange(notes, change).sessions.map((session) => session.text);
}

function rewriteOf(old: Removal, line: string): SessionChange {
  return { rewrite: { old, line } };
}

describe("applySessionChange", () => {
  it("takes a line out of its own note only", () => {
    const change = { removal: lineAt(ONE, 1, "!= Find it: done"), added: null };
    expect(textsAfter(sessions("! Find it\n!= Find it: done\n", "!= Find it: done\n"), change)).toEqual(["! Find it\n", "!= Find it: done\n"]);
  });

  it("rewrites a line where it stands in its own note only, keeping its bullet", () => {
    const change = rewriteOf(lineAt(TWO, 0, "- $ +5 gp found"), "$ +6 gp found");
    expect(textsAfter(sessions("- $ +5 gp found\n", "- $ +5 gp found\nWe rode on.\n"), change)).toEqual(["- $ +5 gp found\n", "- $ +6 gp found\nWe rode on.\n"]);
  });

  it("adds lines at the end of their own note only", () => {
    const change = { removal: null, added: { path: ONE, lines: ["?= Who: Mira"], later: null } };
    expect(textsAfter(sessions("? Who", "We rode on.\n"), change)).toEqual(["? Who\n?= Who: Mira\n", "We rode on.\n"]);
  });

  it("adds the later lines at the end of their own note only", () => {
    const later = { path: TWO, lines: ["? Why, after: Who"], partlyWritten: "Half done:" };
    const change = { removal: null, added: { path: ONE, lines: ["?= Who: Mira"], later } };
    expect(textsAfter(sessions("? Who", "We rode on.\n"), change)).toEqual(["? Who\n?= Who: Mira\n", "We rode on.\n? Why, after: Who\n"]);
  });

  it("adds the later lines after the first ones when both go in one note", () => {
    const later = { path: ONE, lines: ["? Why, after: Who"], partlyWritten: "Half done:" };
    const change = { removal: null, added: { path: ONE, lines: ["?= Who: Mira"], later } };
    expect(textsAfter(sessions("? Who\n", ""), change)).toEqual(["? Who\n?= Who: Mira\n? Why, after: Who\n", ""]);
  });

  it("takes out a line before it adds, so an added line is never the one taken out", () => {
    const change = { removal: lineAt(ONE, 1, "$ Rope"), added: { path: ONE, lines: ["$ Rope"], later: null } };
    const after = applySessionChange(sessions("$ Torch\n", ""), change);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ Torch\n$ Rope\n", ""]);
    expect(after.linesAsRead).toBe(false);
  });

  it("says the lines are as read when the line to take out was found, or there was none", () => {
    expect(applySessionChange(sessions("$ Rope\n", ""), { removal: lineAt(ONE, 0, "$ Rope"), added: null }).linesAsRead).toBe(true);
    expect(applySessionChange(sessions("", ""), NOTHING).linesAsRead).toBe(true);
  });

  it("says the line to rewrite is as read when it was found", () => {
    expect(applySessionChange(sessions("$ Torch\n", ""), rewriteOf(lineAt(ONE, 0, "$ Torch"), "$ Lantern")).linesAsRead).toBe(true);
  });

  it("says a line to take out wasn't as read, and leaves its note as it is", () => {
    const after = applySessionChange(sessions("We waited.\n$ Rope\n", ""), { removal: lineAt(ONE, 0, "$ Rope"), added: null });
    expect(after.linesAsRead).toBe(false);
    expect(after.sessions.map((session) => session.text)).toEqual(["We waited.\n$ Rope\n", ""]);
  });

  it("says a line to rewrite wasn't as read, and leaves its note as it is", () => {
    const after = applySessionChange(sessions("$ +5 gp found later\n", ""), rewriteOf(lineAt(ONE, 0, "$ +5 gp found"), "$ +6 gp found"));
    expect(after.linesAsRead).toBe(false);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ +5 gp found later\n", ""]);
  });

  it("says a line wasn't as read when its note isn't among the sessions", () => {
    const gone = lineAt("Pale Moon/Sessions/Session 9.md", 0, "$ Rope");
    expect(applySessionChange(sessions("$ Rope\n", ""), { removal: gone, added: null }).linesAsRead).toBe(false);
    expect(applySessionChange(sessions("$ Rope\n", ""), rewriteOf(gone, "$ Torch")).linesAsRead).toBe(false);
  });

  it("keeps each session's path and number, and reads its properties again", () => {
    const [taken] = applySessionChange([sessionNoteOf(ONE, 4, "? Who\n---\na: 1\n---\n")], { removal: lineAt(ONE, 0, "? Who"), added: null }).sessions;
    expect(taken).toEqual(sessionNoteOf(ONE, 4, "---\na: 1\n---\n"));
    const [rewritten] = applySessionChange([sessionNoteOf(ONE, 4, "$ Rope\n---\na: 1\n---\n")], rewriteOf(lineAt(ONE, 0, "$ Rope"), "---")).sessions;
    expect(rewritten).toEqual(sessionNoteOf(ONE, 4, "---\n---\na: 1\n---\n"));
  });
});
