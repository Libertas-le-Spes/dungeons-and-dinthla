import { describe, expect, it } from "vitest";
import { Drafts } from "../../src/session-notes/drafts";

const THREE = "Pale Moon/Sessions/Session 3.md";
const FOUR = "Pale Moon/Sessions/Session 4.md";

describe("Drafts", () => {
  it("keeps each session's box apart, and starts empty", () => {
    const drafts = new Drafts();
    drafts.keep(THREE, "? Who");
    expect(drafts.textOf(THREE)).toBe("? Who");
    expect(drafts.textOf(FOUR)).toBe("");
  });

  it("follows a session note when it is renamed", () => {
    const drafts = new Drafts();
    drafts.keep(THREE, "? Who");
    drafts.moved(THREE, FOUR);
    expect(drafts.textOf(FOUR)).toBe("? Who");
    expect(drafts.textOf(THREE)).toBe("");
  });

  it("leaves other drafts alone when a note without one is renamed", () => {
    const drafts = new Drafts();
    drafts.keep(FOUR, "! Find it");
    drafts.moved(THREE, "Pale Moon/Sessions/Session 9.md");
    expect(drafts.textOf(FOUR)).toBe("! Find it");
    expect(drafts.textOf("Pale Moon/Sessions/Session 9.md")).toBe("");
  });

  it("forgets a box that was emptied", () => {
    const drafts = new Drafts();
    drafts.keep(THREE, "? Who");
    drafts.keep(THREE, "");
    drafts.moved(THREE, FOUR);
    expect(drafts.textOf(FOUR)).toBe("");
  });
});
