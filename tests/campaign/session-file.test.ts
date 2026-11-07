import { describe, expect, it } from "vitest";
import { firstLineAfterProperties, sessionLabelOf, sessionNumberOf } from "../../src/campaign/session-file";

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

describe("firstLineAfterProperties", () => {
  it("starts after the properties block", () => {
    expect(firstLineAfterProperties("---\nplayed: 2026-03-14\ntitle: The ford\n---\n? Who")).toBe(4);
  });

  it("starts at the top of a note with no properties", () => {
    expect(firstLineAfterProperties("? Who\n---\nnot properties\n---")).toBe(0);
  });

  it("starts after an empty properties block", () => {
    expect(firstLineAfterProperties("---\n---\n? Who")).toBe(2);
  });

  it("starts after properties that end the note", () => {
    expect(firstLineAfterProperties("---\nplayed: 2026-03-14\n---")).toBe(3);
  });
});
