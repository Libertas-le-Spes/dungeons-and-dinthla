import { describe, expect, it } from "vitest";
import { sessionLabelOf, sessionNumberOf } from "../../src/campaign/session-file";

describe("sessionNumberOf", () => {
  it("reads the number of a note in the campaign's Sessions folder", () => {
    expect(sessionNumberOf("Pale Moon/Sessions/Session 12.md", "Pale Moon")).toBe(12);
  });

  it("finds no number for any other note", () => {
    for (const path of [
      "Pale Moon/Sessions/Notes.md",
      "Pale Moon/Sessions/Session 2.canvas",
      "Pale Moon/Sessions/Old/Session 3.md",
      "Pale Moon/Session 4.md",
      "Ashen Road/Sessions/Session 1.md",
      "Pale Moon Extra/Sessions/Session 1.md",
    ]) {
      expect(sessionNumberOf(path, "Pale Moon")).toBeNull();
    }
  });
});

describe("sessionLabelOf", () => {
  it("names a session by its note", () => {
    expect(sessionLabelOf("Pale Moon/Sessions/Session 12.md")).toBe("Session 12");
  });
});
