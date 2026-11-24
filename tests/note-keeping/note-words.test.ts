import { describe, expect, it } from "vitest";
import { STUB_SYNTAX } from "../host/stub-syntax";
import { hasNoWords, holdsOnlyPluginPropertiesIn, wordsOf } from "../../src/note-keeping/note-words";

describe("wordsOf", () => {
  it("is the text below the properties, byte for byte", () => {
    expect(wordsOf('---\nsession: "[[Session 2]]"\n---\nHis words\r\n  here', STUB_SYNTAX)).toBe("His words\r\n  here");
  });

  it("is the whole text of a note with no properties", () => {
    expect(wordsOf("His words", STUB_SYNTAX)).toBe("His words");
  });
});

describe("hasNoWords", () => {
  it("counts blank lines, spaces and tabs below the properties as nothing", () => {
    expect(hasNoWords("---\nlines: []\n---\n \n\t\n\n", STUB_SYNTAX)).toBe(true);
  });

  it("counts any other character as his", () => {
    expect(hasNoWords("---\nlines: []\n---\n.", STUB_SYNTAX)).toBe(false);
  });
});

describe("holdsOnlyPluginPropertiesIn", () => {
  it("is true for a session and a list of lines written the way Obsidian writes them", () => {
    expect(holdsOnlyPluginPropertiesIn('---\nsession: "[[Session 2]]"\nlines:\n  - "? Who sent Mira"\n  - "$ 5 gp"\n---\n', STUB_SYNTAX)).toBe(true);
  });

  it("is true for a list whose items start at the left edge, and for blank lines inside the properties", () => {
    expect(holdsOnlyPluginPropertiesIn('---\nlines:\n- "? Who"\n\nsession: "[[Session 2]]"\n---\n', STUB_SYNTAX)).toBe(true);
  });

  it("is true for quoted names of the plugin's two properties", () => {
    expect(holdsOnlyPluginPropertiesIn('---\n"session": "[[Session 2]]"\n\'lines\': []\n---\n', STUB_SYNTAX)).toBe(true);
  });

  it("is true for a note with no properties at all", () => {
    expect(holdsOnlyPluginPropertiesIn("", STUB_SYNTAX)).toBe(true);
  });

  it("is false when a property of his is there, before or after the plugin's", () => {
    expect(holdsOnlyPluginPropertiesIn('---\ntags: ["pale"]\nlines: []\n---\n', STUB_SYNTAX)).toBe(false);
    expect(holdsOnlyPluginPropertiesIn('---\nlines: []\ntags:\n  - pale\n---\n', STUB_SYNTAX)).toBe(false);
  });

  it("is false for a comment in the properties, which is his", () => {
    expect(holdsOnlyPluginPropertiesIn("---\n# my note to self\nlines: []\n---\n", STUB_SYNTAX)).toBe(false);
  });

  it("is false for a property whose name only starts like the plugin's", () => {
    expect(holdsOnlyPluginPropertiesIn("---\nlines-more: 1\n---\n", STUB_SYNTAX)).toBe(false);
  });
});
