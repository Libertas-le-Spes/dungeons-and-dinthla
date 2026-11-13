import { describe, expect, it } from "vitest";
import { linkOnSkippedLine, onlyLinkTargetsChanged, withLinksRewritten } from "../../../src/session-notes/renumbering/link-rewriting";
import type { NewTarget } from "../../../src/session-notes/renumbering/wiki-links";

const FOUR_TO_THREE: NewTarget = (target) => {
  if (target === "Session 4") return "Session 3";
  return null;
};

function note(lines: string[]): string {
  return lines.join("\n");
}

const PLAIN = note(["Tracks lead to [[Session 4]].", "! Find it, from: [[Session 4|the mill]]", ""]);

describe("withLinksRewritten", () => {
  it("rewrites the links in the note's lines", () => {
    expect(withLinksRewritten(PLAIN, FOUR_TO_THREE)).toBe(note(["Tracks lead to [[Session 3]].", "! Find it, from: [[Session 3|the mill]]", ""]));
  });

  it("leaves the note's properties as they are", () => {
    const text = note(["---", "from: \"[[Session 4]]\"", "---", "See [[Session 4]]."]);
    expect(withLinksRewritten(text, FOUR_TO_THREE)).toBe(note(["---", "from: \"[[Session 4]]\"", "---", "See [[Session 3]]."]));
  });

  it("leaves links in a code block, a comment and a math block", () => {
    const text = note(["```", "[[Session 4]]", "```", "%% [[Session 4]] %%", "$$", "[[Session 4]]", "$$", "[[Session 4]]"]);
    expect(withLinksRewritten(text, FOUR_TO_THREE)).toBe(note(["```", "[[Session 4]]", "```", "%% [[Session 4]] %%", "$$", "[[Session 4]]", "$$", "[[Session 3]]"]));
  });

  it("rewrites a link after an odd number of item lines, which hide nothing", () => {
    const text = note(["$$ Rope :lost", "See [[Session 4]]."]);
    expect(withLinksRewritten(text, FOUR_TO_THREE)).toBe(note(["$$ Rope :lost", "See [[Session 3]]."]));
  });

  it("keeps the note's line endings", () => {
    expect(withLinksRewritten("See [[Session 4]]\r\nthen [[Session 4]]\r\n", FOUR_TO_THREE)).toBe("See [[Session 3]]\r\nthen [[Session 3]]\r\n");
  });

  it("gives back the same text when no link has a new target", () => {
    expect(withLinksRewritten("See [[Mira]].\n", FOUR_TO_THREE)).toBe("See [[Mira]].\n");
  });
});

describe("linkOnSkippedLine", () => {
  it("says yes for a link with a new target in the properties, a code block, a comment line or an indented list", () => {
    expect(linkOnSkippedLine(note(["---", "from: \"[[Session 4]]\"", "---", "Done."]), FOUR_TO_THREE)).toBe(true);
    expect(linkOnSkippedLine(note(["```", "[[Session 4]]", "```"]), FOUR_TO_THREE)).toBe(true);
    expect(linkOnSkippedLine("Met [[Session 4]] %%x%%", FOUR_TO_THREE)).toBe(true);
    expect(linkOnSkippedLine(note(["Plans:", "", "    - [[Session 4]]"]), FOUR_TO_THREE)).toBe(true);
  });

  it("says no when the only links on skipped lines have no new target", () => {
    expect(linkOnSkippedLine(note(["```", "[[Mira]]", "```", "[[Session 4]]"]), FOUR_TO_THREE)).toBe(false);
  });

  it("says no when links with new targets are all on lines that are rewritten", () => {
    expect(linkOnSkippedLine(PLAIN, FOUR_TO_THREE)).toBe(false);
  });
});

describe("onlyLinkTargetsChanged", () => {
  it("accepts what withLinksRewritten gives", () => {
    expect(onlyLinkTargetsChanged(PLAIN, withLinksRewritten(PLAIN, FOUR_TO_THREE), FOUR_TO_THREE)).toBe(true);
  });

  it("accepts a text with nothing changed", () => {
    expect(onlyLinkTargetsChanged(PLAIN, PLAIN, FOUR_TO_THREE)).toBe(true);
  });

  it("refuses a word changed outside the links", () => {
    expect(onlyLinkTargetsChanged(PLAIN, PLAIN.replace("Tracks", "Trails"), FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a link's alias changed", () => {
    expect(onlyLinkTargetsChanged(PLAIN, PLAIN.replace("the mill", "the keep"), FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a link given a target the new targets don't give", () => {
    expect(onlyLinkTargetsChanged(PLAIN, PLAIN.replace("[[Session 4]]", "[[Session 8]]"), FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a link added or taken out", () => {
    expect(onlyLinkTargetsChanged(PLAIN, PLAIN.replace("[[Session 4]]", "Session 4"), FOUR_TO_THREE)).toBe(false);
    expect(onlyLinkTargetsChanged(PLAIN, `${PLAIN}[[Mira]]`, FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a line added or taken out", () => {
    expect(onlyLinkTargetsChanged(PLAIN, `${PLAIN}More.\n`, FOUR_TO_THREE)).toBe(false);
    expect(onlyLinkTargetsChanged(PLAIN, "Tracks lead to [[Session 4]].\n", FOUR_TO_THREE)).toBe(false);
  });

  it("refuses the last line taken out", () => {
    expect(onlyLinkTargetsChanged("See [[Session 4]]\nMore.", "See [[Session 3]]", FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a link changed in the properties", () => {
    const before = note(["---", "from: \"[[Session 4]]\"", "---", "Done."]);
    const after = note(["---", "from: \"[[Session 3]]\"", "---", "Done."]);
    expect(onlyLinkTargetsChanged(before, after, FOUR_TO_THREE)).toBe(false);
  });

  it("refuses a link changed in a hidden line", () => {
    const before = note(["```", "[[Session 4]]", "```"]);
    const after = note(["```", "[[Session 3]]", "```"]);
    expect(onlyLinkTargetsChanged(before, after, FOUR_TO_THREE)).toBe(false);
  });
});
