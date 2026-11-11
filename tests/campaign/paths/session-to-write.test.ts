import { describe, expect, it } from "vitest";
import { latestSession, latestNumberIsShared, latestSessionWanted, NoSessionToWrite, SESSIONS_SHARE_A_NUMBER, sessionToWrite } from "../../../src/campaign/paths/session-to-write";

const PATHS = ["Pale Moon/Pale Moon.md", "Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 10.md", "Ashen Road/Sessions/Session 11.md"];
const NO_SESSION = "Start a session first.";
const LATEST = latestSessionWanted(NO_SESSION);

function openAt(activePath: string | null, earliestSession: number) {
  return { activePath, earliestSession, noSession: NO_SESSION };
}

describe("sessionToWrite", () => {
  it("writes in the session note that is open", () => {
    expect(sessionToWrite("Pale Moon", PATHS, openAt("Pale Moon/Sessions/Session 2.md", 1))).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("writes in the campaign's latest session when no session of it is open", () => {
    expect(sessionToWrite("Pale Moon", PATHS, openAt("Pale Moon/Characters/Mira.md", 1))).toBe("Pale Moon/Sessions/Session 10.md");
    expect(sessionToWrite("Pale Moon", PATHS, openAt(null, 1))).toBe("Pale Moon/Sessions/Session 10.md");
    expect(sessionToWrite("Pale Moon", PATHS, openAt("Ashen Road/Sessions/Session 11.md", 1))).toBe("Pale Moon/Sessions/Session 10.md");
  });

  it("writes in the campaign's latest session when the latest is wanted", () => {
    expect(sessionToWrite("Pale Moon", PATHS, LATEST)).toBe("Pale Moon/Sessions/Session 10.md");
  });

  it("writes in the only session", () => {
    expect(sessionToWrite("Pale Moon", ["Pale Moon/Sessions/Session 1.md"], LATEST)).toBe("Pale Moon/Sessions/Session 1.md");
  });

  it("writes in the latest session instead of an open one earlier than the line may go in", () => {
    expect(sessionToWrite("Pale Moon", PATHS, openAt("Pale Moon/Sessions/Session 2.md", 3))).toBe("Pale Moon/Sessions/Session 10.md");
  });

  it("writes in the open session when it is the earliest the line may go in", () => {
    expect(sessionToWrite("Pale Moon", PATHS, openAt("Pale Moon/Sessions/Session 2.md", 2))).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("refuses with the caller's words when the campaign has no session", () => {
    expect(() => sessionToWrite("Pale Moon", ["Pale Moon/Pale Moon.md"], LATEST)).toThrow(new NoSessionToWrite(NO_SESSION));
    expect(() => sessionToWrite("Pale Moon", ["Pale Moon/Pale Moon.md"], LATEST)).toThrow(NoSessionToWrite);
  });

  it("refuses to choose when two session notes share the latest number", () => {
    const paths = ["Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 03.md", "Pale Moon/Sessions/Session 2.md"];
    expect(() => sessionToWrite("Pale Moon", paths, LATEST)).toThrow(new NoSessionToWrite(SESSIONS_SHARE_A_NUMBER));
    expect(() => sessionToWrite("Pale Moon", paths, LATEST)).toThrow(NoSessionToWrite);
  });

  it("writes in the open session when only the latest number is shared", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 03.md"];
    expect(sessionToWrite("Pale Moon", paths, openAt("Pale Moon/Sessions/Session 2.md", 1))).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("passes over an open session whose number another note shares", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 02.md", "Pale Moon/Sessions/Session 3.md"];
    expect(sessionToWrite("Pale Moon", paths, openAt("Pale Moon/Sessions/Session 2.md", 1))).toBe("Pale Moon/Sessions/Session 3.md");
  });
});

describe("latestSession", () => {
  it("finds the campaign's latest session by number", () => {
    expect(latestSession("Pale Moon", PATHS)).toBe("Pale Moon/Sessions/Session 10.md");
    expect(latestSession("Pale Moon", ["Pale Moon/Pale Moon.md"])).toBeNull();
  });

  it("refuses to choose when two session notes share the latest number", () => {
    const paths = ["Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 03.md", "Pale Moon/Sessions/Session 2.md"];
    expect(latestSession("Pale Moon", paths)).toBeNull();
    expect(latestNumberIsShared("Pale Moon", paths)).toBe(true);
  });

  it("still chooses when an earlier number is shared", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 02.md", "Pale Moon/Sessions/Session 3.md"];
    expect(latestSession("Pale Moon", paths)).toBe("Pale Moon/Sessions/Session 3.md");
    expect(latestNumberIsShared("Pale Moon", paths)).toBe(false);
  });

  it("chooses Session 0 when it is the only one", () => {
    expect(latestSession("Pale Moon", ["Pale Moon/Sessions/Session 0.md"])).toBe("Pale Moon/Sessions/Session 0.md");
  });
});
