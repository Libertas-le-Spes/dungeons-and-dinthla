import { describe, expect, it } from "vitest";
import { latestSession, latestNumberIsShared, sessionToWriteIn } from "../../src/campaign/session-to-write";

const PATHS = ["Pale Moon/Pale Moon.md", "Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 10.md", "Ashen Road/Sessions/Session 11.md"];

describe("sessionToWriteIn", () => {
  it("writes in the session note that is open", () => {
    expect(sessionToWriteIn("Pale Moon/Sessions/Session 2.md", "Pale Moon", PATHS, 1)).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("writes in the campaign's latest session when no session of it is open", () => {
    expect(sessionToWriteIn("Pale Moon/Characters/Mira.md", "Pale Moon", PATHS, 1)).toBe("Pale Moon/Sessions/Session 10.md");
    expect(sessionToWriteIn(null, "Pale Moon", PATHS, 1)).toBe("Pale Moon/Sessions/Session 10.md");
    expect(sessionToWriteIn("Ashen Road/Sessions/Session 11.md", "Pale Moon", PATHS, 1)).toBe("Pale Moon/Sessions/Session 10.md");
  });

  it("finds nowhere to write in a campaign with no sessions", () => {
    expect(sessionToWriteIn(null, "Pale Moon", ["Pale Moon/Pale Moon.md"], 1)).toBeNull();
  });

  it("writes in the latest session instead of one earlier than the question, where the line would never match", () => {
    expect(sessionToWriteIn("Pale Moon/Sessions/Session 2.md", "Pale Moon", PATHS, 5)).toBe("Pale Moon/Sessions/Session 10.md");
  });

  it("finds the campaign's latest session by number", () => {
    expect(latestSession("Pale Moon", PATHS)).toBe("Pale Moon/Sessions/Session 10.md");
    expect(latestSession("Pale Moon", ["Pale Moon/Pale Moon.md"])).toBeNull();
  });

  it("refuses to choose when two session notes share the latest number", () => {
    const paths = ["Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 03.md", "Pale Moon/Sessions/Session 2.md"];
    expect(latestSession("Pale Moon", paths)).toBeNull();
    expect(latestNumberIsShared("Pale Moon", paths)).toBe(true);
    expect(sessionToWriteIn(null, "Pale Moon", paths, 0)).toBeNull();
  });

  it("still chooses when an earlier number is shared", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 02.md", "Pale Moon/Sessions/Session 3.md"];
    expect(latestSession("Pale Moon", paths)).toBe("Pale Moon/Sessions/Session 3.md");
    expect(latestNumberIsShared("Pale Moon", paths)).toBe(false);
  });

  it("chooses Session 0 when it is the only one", () => {
    expect(latestSession("Pale Moon", ["Pale Moon/Sessions/Session 0.md"])).toBe("Pale Moon/Sessions/Session 0.md");
  });

  it("writes in the open session when only the latest number is shared", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 3.md", "Pale Moon/Sessions/Session 03.md"];
    expect(sessionToWriteIn("Pale Moon/Sessions/Session 2.md", "Pale Moon", paths, 1)).toBe("Pale Moon/Sessions/Session 2.md");
  });

  it("passes over an open session whose number another note shares", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 02.md", "Pale Moon/Sessions/Session 3.md"];
    expect(sessionToWriteIn("Pale Moon/Sessions/Session 2.md", "Pale Moon", paths, 1)).toBe("Pale Moon/Sessions/Session 3.md");
  });
});
