import { describe, expect, it } from "vitest";
import { hasNoWords, holdsOnlyPluginPropertiesIn, wordsOf } from "../../src/kind-notes/note-words";

describe("wordsOf", () => {
  it("is the text below the properties, byte for byte", () => {
    expect(wordsOf('---\nsession: "[[Session 2]]"\n---\nHis words\r\n  here')).toBe("His words\r\n  here");
  });

  it("is the whole text of a note with no properties", () => {
    expect(wordsOf("His words")).toBe("His words");
  });
});

describe("hasNoWords", () => {
  it("counts blank lines, spaces and tabs below the properties as nothing", () => {
    expect(hasNoWords("---\nlines: []\n---\n \n\t\n\n")).toBe(true);
  });

  it("counts any other character as his", () => {
    expect(hasNoWords("---\nlines: []\n---\n.")).toBe(false);
  });
});

describe("holdsOnlyPluginPropertiesIn", () => {
  it("is true for a session and a list of lines written the way Obsidian writes them", () => {
    expect(holdsOnlyPluginPropertiesIn('---\nsession: "[[Session 2]]"\nlines:\n  - "? Who sent Mira"\n  - "$ 5 gp"\n---\n')).toBe(true);
  });

  it("is true for a list whose items start at the left edge, and for blank lines inside the properties", () => {
    expect(holdsOnlyPluginPropertiesIn('---\nlines:\n- "? Who"\n\nsession: "[[Session 2]]"\n---\n')).toBe(true);
  });

  it("is true for quoted names of the plugin's two properties", () => {
    expect(holdsOnlyPluginPropertiesIn('---\n"session": "[[Session 2]]"\n\'lines\': []\n---\n')).toBe(true);
  });

  it("is true for a note with no properties at all", () => {
    expect(holdsOnlyPluginPropertiesIn("")).toBe(true);
  });

  it("is false when a property of his is there, before or after the plugin's", () => {
    expect(holdsOnlyPluginPropertiesIn('---\ntags: ["pale"]\nlines: []\n---\n')).toBe(false);
    expect(holdsOnlyPluginPropertiesIn('---\nlines: []\ntags:\n  - pale\n---\n')).toBe(false);
  });

  it("is false for a comment in the properties, which is his", () => {
    expect(holdsOnlyPluginPropertiesIn("---\n# my note to self\nlines: []\n---\n")).toBe(false);
  });

  it("is false for a property whose name only starts like the plugin's", () => {
    expect(holdsOnlyPluginPropertiesIn("---\nlines-more: 1\n---\n")).toBe(false);
  });
});
