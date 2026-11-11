import { describe, expect, it } from "vitest";
import { firstLineAfterProperties, keepsProperties, sessionLabelOf, sessionNumberOf } from "../../../src/campaign/paths/session-file";

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

describe("keepsProperties", () => {
  it("knows when a change would turn lines into properties", () => {
    expect(keepsProperties("? Who\n---\n? Where\n---\n", "---\n? Where\n---\n")).toBe(false);
    expect(keepsProperties("---\na: 1\n---\n? Who\n", "---\na: 1\n---\n")).toBe(true);
    expect(keepsProperties("? Who\n---\nmid\n", "---\nmid\n")).toBe(true);
  });

  it("ignores a line ending that a change adds or takes away", () => {
    expect(keepsProperties("---\r\na: 1\r\n---", "---\r\na: 1\r\n---\r\n? y\r\n")).toBe(true);
  });
});

describe("properties, as Obsidian reads them", () => {
  it("closes them only at a --- that starts a line after a line break", () => {
    expect(firstLineAfterProperties("---\na\r---\n")).toBe(0);
    expect(firstLineAfterProperties("---\na\n---\rb")).toBe(0);
    expect(firstLineAfterProperties("---\n---\nb")).toBe(2);
  });
});
