import { describe, expect, it } from "vitest";
import { sessionToWriteIn } from "../../src/campaign/session-to-write";

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
});
