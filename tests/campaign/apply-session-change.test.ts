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

const NOTHING: SessionChange = { removal: null, rewrite: null, added: null, addedLater: null };

function textsAfter(notes: SessionNote[], change: SessionChange): string[] {
  return applySessionChange(notes, change).sessions.map((session) => session.text);
}

describe("applySessionChange", () => {
  it("takes a line out of its own note only", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 1, "!= Find it: done") };
    expect(textsAfter(sessions("! Find it\n!= Find it: done\n", "!= Find it: done\n"), change)).toEqual(["! Find it\n", "!= Find it: done\n"]);
  });

  it("rewrites a line where it stands, keeping its bullet", () => {
    const change = { ...NOTHING, rewrite: { old: lineAt(TWO, 0, "- $ +5 gp found"), line: "$ +6 gp found" } };
    expect(textsAfter(sessions("$ +5 gp found\n", "- $ +5 gp found\nWe rode on.\n"), change)).toEqual(["$ +5 gp found\n", "- $ +6 gp found\nWe rode on.\n"]);
  });

  it("adds lines at the end of their note, and the later lines at the end of theirs", () => {
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"] }, addedLater: { path: TWO, lines: ["? Why, after: Who"], partlyWritten: "Half done:" } };
    expect(textsAfter(sessions("? Who", "We rode on.\n"), change)).toEqual(["? Who\n?= Who: Mira\n", "We rode on.\n? Why, after: Who\n"]);
  });

  it("adds the later lines after the first ones when both go in one note", () => {
    const change = { ...NOTHING, added: { path: ONE, lines: ["?= Who: Mira"] }, addedLater: { path: ONE, lines: ["? Why, after: Who"], partlyWritten: "Half done:" } };
    expect(textsAfter(sessions("? Who\n", ""), change)).toEqual(["? Who\n?= Who: Mira\n? Why, after: Who\n", ""]);
  });

  it("takes out a line before it rewrites, so the rewrite finds its line where it is after", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "$ Rope"), rewrite: { old: lineAt(ONE, 1, "$ Lamp"), line: "$ Lantern" } };
    const after = applySessionChange(sessions("$ Rope\n$ Torch\n$ Lamp\n", ""), change);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ Torch\n$ Lantern\n", ""]);
    expect(after.linesWhereRead).toBe(true);
  });

  it("rewrites a line before it adds, so an added line is never the one rewritten", () => {
    const change = { ...NOTHING, rewrite: { old: lineAt(ONE, 1, "$ Rope"), line: "$ Lantern" }, added: { path: ONE, lines: ["$ Rope"] } };
    const after = applySessionChange(sessions("$ Torch\n", ""), change);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ Torch\n$ Rope\n", ""]);
    expect(after.linesWhereRead).toBe(false);
  });

  it("takes out a line before it adds, so an added line is never the one taken out", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 1, "$ Rope"), added: { path: ONE, lines: ["$ Rope"] } };
    const after = applySessionChange(sessions("$ Torch\n", ""), change);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ Torch\n$ Rope\n", ""]);
    expect(after.linesWhereRead).toBe(false);
  });

  it("says the lines were where they were read when every one was found", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "$ Rope"), rewrite: { old: lineAt(TWO, 0, "$ Torch"), line: "$ Lantern" } };
    expect(applySessionChange(sessions("$ Rope\n", "$ Torch\n"), change).linesWhereRead).toBe(true);
    expect(applySessionChange(sessions("", ""), NOTHING).linesWhereRead).toBe(true);
  });

  it("says a line to take out wasn't where it was read, and leaves its note as it is", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "$ Rope") };
    const after = applySessionChange(sessions("We waited.\n$ Rope\n", ""), change);
    expect(after.linesWhereRead).toBe(false);
    expect(after.sessions.map((session) => session.text)).toEqual(["We waited.\n$ Rope\n", ""]);
  });

  it("says a line to rewrite wasn't where it was read, and leaves its note as it is", () => {
    const change = { ...NOTHING, rewrite: { old: lineAt(ONE, 0, "$ +5 gp found"), line: "$ +6 gp found" } };
    const after = applySessionChange(sessions("$ +5 gp found later\n", ""), change);
    expect(after.linesWhereRead).toBe(false);
    expect(after.sessions.map((session) => session.text)).toEqual(["$ +5 gp found later\n", ""]);
  });

  it("says a line wasn't where it was read when its note isn't among the sessions", () => {
    const removal = { ...NOTHING, removal: lineAt("Pale Moon/Sessions/Session 9.md", 0, "$ Rope") };
    const rewrite = { ...NOTHING, rewrite: { old: lineAt("Pale Moon/Sessions/Session 9.md", 0, "$ Rope"), line: "$ Torch" } };
    expect(applySessionChange(sessions("$ Rope\n", ""), removal).linesWhereRead).toBe(false);
    expect(applySessionChange(sessions("$ Rope\n", ""), rewrite).linesWhereRead).toBe(false);
  });

  it("says the rewrite wasn't where it was read even when the line to take out was", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "$ Rope"), rewrite: { old: lineAt(TWO, 0, "$ Torch"), line: "$ Lantern" } };
    expect(applySessionChange(sessions("$ Rope\n", "$ Lantern\n"), change).linesWhereRead).toBe(false);
  });

  it("keeps each session's path and number, and reads its properties again", () => {
    const change = { ...NOTHING, removal: lineAt(ONE, 0, "? Who") };
    const [one] = applySessionChange([sessionNoteOf(ONE, 4, "? Who\n---\na: 1\n---\n")], change).sessions;
    expect(one).toEqual(sessionNoteOf(ONE, 4, "---\na: 1\n---\n"));
  });
});
