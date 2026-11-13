import { describe, expect, it } from "vitest";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { hiddenRefusal, notHidden } from "../../../src/campaign/changes/hidden-refusal";
import { linesAddedTo, lineTakenOut, type SessionChange } from "../../../src/campaign/changes/session-change";
import { sessionNoteOf } from "../../../src/campaign/paths/session-file";
import { WOULD_BE_HIDDEN, type Removal } from "../../../src/campaign/writing/note-editor";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const NINE = "Pale Moon/Sessions/Session 9.md";

function sessionsOf(texts: Record<string, string>): SessionNote[] {
  return Object.entries(texts).map(([path, text], index) => sessionNoteOf(path, index + 1, text));
}

function removal(path: string): Removal {
  return { path, line: 0, matches: () => true };
}

function withLater(path: string, later: string): SessionChange {
  return { removal: null, added: { path, lines: ["?= Who: Mira"], later: { path: later, lines: ["? Why, after: Who"], partlyWritten: "Some were written:" } } };
}

describe("hiddenRefusal", () => {
  it("says nothing for lines that land in plain text", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "? Who\n" }), linesAddedTo(ONE, ["?= Who: Mira"]))).toBeNull();
  });

  it("refuses lines that land below a comment that never closes", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "%% aside\n" }), linesAddedTo(ONE, ["? Who"]))).toBe(WOULD_BE_HIDDEN);
  });

  it("refuses lines that land below a math block that never closes", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "$$\nx\n" }), linesAddedTo(ONE, ["? Who"]))).toBe(WOULD_BE_HIDDEN);
  });

  it("says nothing for lines that land below an item line", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "$$ Rope :lost\n" }), linesAddedTo(ONE, ["? Who"]))).toBeNull();
  });

  it("refuses, as if hidden, lines added to a note that isn't among the sessions", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "? Who\n" }), linesAddedTo(NINE, ["? Why"]))).toBe(WOULD_BE_HIDDEN);
  });

  it("says nothing for a change that only takes a line out", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "%% aside\n? Who\n" }), lineTakenOut(removal(ONE)))).toBeNull();
  });

  it("says nothing for a change that rewrites a line", () => {
    const change: SessionChange = { rewrite: { old: removal(ONE), line: "$ 5 gp found" } };
    expect(hiddenRefusal(sessionsOf({ [ONE]: "%% aside\n$ 4 gp found\n" }), change)).toBeNull();
  });

  it("refuses a follow-up's later note that is hidden, though the first is plain", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "? Who\n", [TWO]: "%% aside\n" }), withLater(ONE, TWO))).toBe(WOULD_BE_HIDDEN);
  });

  it("refuses a follow-up's later note that isn't among the sessions", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "? Who\n" }), withLater(ONE, TWO))).toBe(WOULD_BE_HIDDEN);
  });

  it("says nothing when both notes are plain", () => {
    expect(hiddenRefusal(sessionsOf({ [ONE]: "? Who\n", [TWO]: "" }), withLater(ONE, TWO))).toBeNull();
  });
});

describe("notHidden", () => {
  it("goes on for plain text and reads the sessions when asked", async () => {
    const check = notHidden<string>(() => sessionsOf({ [ONE]: "? Who\n" }), (line) => linesAddedTo(ONE, [line]));
    expect(await check("? Why")).toBe("go on");
  });

  it("gives the refusal as an error for a hidden landing", async () => {
    const check = notHidden<string>(() => sessionsOf({ [ONE]: "%% aside\n" }), (line) => linesAddedTo(ONE, [line]));
    expect(await check("? Why")).toEqual({ error: WOULD_BE_HIDDEN });
  });
});
