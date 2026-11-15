import { describe, expect, it } from "vitest";
import { noteTitleOf } from "../../src/note-page/note-title";

const FOLDERS = ["Campaigns/Pale Moon"];

describe("noteTitleOf", () => {
  it("starts a session's kind note with its type and ends it with the session's name", () => {
    expect(noteTitleOf("Campaigns/Pale Moon/Questions/Session 1.md", FOLDERS)).toBe("Questions - Session 1");
    expect(noteTitleOf("Campaigns/Pale Moon/Quests/Session 2.md", FOLDERS)).toBe("Quests - Session 2");
    expect(noteTitleOf("Campaigns/Pale Moon/Funds/Session 12.md", FOLDERS)).toBe("Funds - Session 12");
  });

  it("keeps the name of every other note of the campaign", () => {
    expect(noteTitleOf("Campaigns/Pale Moon/Places/Old Mill.md", FOLDERS)).toBe("Old Mill");
    expect(noteTitleOf("Campaigns/Pale Moon/Items/Rope.md", FOLDERS)).toBe("Rope");
    expect(noteTitleOf("Campaigns/Pale Moon/Sessions/Session 1.md", FOLDERS)).toBe("Session 1");
    expect(noteTitleOf("Campaigns/Pale Moon/Questions/Old/Session 1.md", FOLDERS)).toBe("Session 1");
  });

  it("keeps the name of a note outside every campaign, even in a folder called Questions", () => {
    expect(noteTitleOf("Questions/Session 1.md", FOLDERS)).toBe("Session 1");
    expect(noteTitleOf("Campaigns/Other/Questions/Session 1.md", FOLDERS)).toBe("Session 1");
  });
});
