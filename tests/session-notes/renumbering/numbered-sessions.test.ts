import { describe, expect, it } from "vitest";
import { byNumber, isCounted, sessionPathOf, sessionsIn, sharedNumberIn } from "../../../src/session-notes/renumbering/numbered-sessions";

const FOLDER = "Pale Moon";

describe("sessionsIn", () => {
  it("gives the session notes of the campaign with their numbers, and nothing else", () => {
    const paths = [`${FOLDER}/Sessions/Session 2.md`, `${FOLDER}/Pale Moon.md`, "Ashen Road/Sessions/Session 9.md", `${FOLDER}/Sessions/Session 10.md`];
    expect(sessionsIn(FOLDER, paths)).toEqual([
      { path: `${FOLDER}/Sessions/Session 2.md`, number: 2 },
      { path: `${FOLDER}/Sessions/Session 10.md`, number: 10 },
    ]);
  });
});

describe("sharedNumberIn", () => {
  it("gives the number two sessions share", () => {
    expect(sharedNumberIn([{ path: "a", number: 1 }, { path: "b", number: 3 }, { path: "c", number: 3 }])).toBe(3);
  });

  it("gives nothing when every number is different", () => {
    expect(sharedNumberIn([{ path: "a", number: 1 }, { path: "b", number: 2 }])).toBeNull();
  });
});

describe("byNumber", () => {
  it("orders the lower number first", () => {
    const sessions = [{ path: "b", number: 7 }, { path: "a", number: 2 }];
    expect(sessions.sort(byNumber).map((session) => session.path)).toEqual(["a", "b"]);
  });
});

describe("isCounted", () => {
  it("counts Session 1 and later, not Session 0", () => {
    expect(isCounted({ path: "a", number: 0 })).toBe(false);
    expect(isCounted({ path: "a", number: 1 })).toBe(true);
  });
});

describe("sessionPathOf", () => {
  it("names the session's file in the campaign's Sessions folder", () => {
    expect(sessionPathOf(FOLDER, 4)).toBe("Pale Moon/Sessions/Session 4.md");
  });
});
