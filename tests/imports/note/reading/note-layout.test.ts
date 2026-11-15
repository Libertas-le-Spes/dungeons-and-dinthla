import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { INVENTORY_SECTION, NUMBERS_SECTION, SPELLS_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { MOST_NOTE_LINES } from "../../../../src/imports/note/reading/note-limits";
import { NoteLayout } from "../../../../src/imports/note/reading/note-layout";
import { manyLines, textOf } from "../../builders/line-helpers";

const INVENTORY = INVENTORY_SECTION.heading;
const SPELLS = SPELLS_SECTION.heading;

function spanOf(text: string, section = INVENTORY_SECTION): { start: number; end: number } | null {
  const span = NoteLayout.of(text).spanOf(section);
  if (span === null) return null;
  return { start: span.start, end: span.end };
}

function startOf(layout: NoteLayout, section: typeof INVENTORY_SECTION): number | null {
  const span = layout.spanOf(section);
  if (span === null) return null;
  return span.start;
}

describe("NoteLayout's sections", () => {
  it("runs a section from its heading to the next heading of level one", () => {
    expect(spanOf(textOf("Top", INVENTORY, "- a", "- b", "# Big", "Rest"))).toEqual({ start: 1, end: 4 });
  });

  it("runs a section from its heading to the next heading of level two", () => {
    expect(spanOf(textOf("Top", INVENTORY, "- a", "## Mine", "Rest"))).toEqual({ start: 1, end: 3 });
  });

  it("keeps a heading of level three inside the section", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "### small", "more", "## Mine"))).toEqual({ start: 0, end: 4 });
  });

  it("leaves the blank lines at the end of a section out of it, so they stay his", () => {
    expect(spanOf(textOf("Top", INVENTORY, "- a", "", "", "## Mine"))).toEqual({ start: 1, end: 3 });
  });

  it("leaves the final empty line of the note out of the last section", () => {
    expect(spanOf(textOf("Top", INVENTORY, "- a", ""))).toEqual({ start: 1, end: 3 });
  });

  it("keeps a blank line inside a section when text follows it", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "", "typed", "## Mine"))).toEqual({ start: 0, end: 4 });
  });

  it("makes a section of only its heading end right after the heading", () => {
    expect(spanOf(textOf(INVENTORY, "", "## Mine"))).toEqual({ start: 0, end: 1 });
  });

  it("takes a heading that has spaces after it for the section's heading", () => {
    expect(spanOf(textOf(`${INVENTORY}  `, "- a"))).toEqual({ start: 0, end: 2 });
  });

  it("does not take a heading with other words, a different level or spaces before it for the section's", () => {
    const near = textOf("# Inventory", "### Inventory", ` ${INVENTORY}x`, `${INVENTORY} extra`);
    expect(spanOf(near)).toBeNull();
  });

  it("takes the heading older notes were written with for the same section", () => {
    expect(spanOf(textOf("Top", INVENTORY_SECTION.formerHeading, "- a", "## Mine", "Rest"))).toEqual({ start: 1, end: 3 });
  });

  it("refuses a note with a section under its heading and again under its older heading", () => {
    expect(() => NoteLayout.of(textOf(INVENTORY, "- a", INVENTORY_SECTION.formerHeading, "- b"))).toThrow(Refusal);
  });

  it("takes a heading with up to three spaces before it as a heading, so it ends a section", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "   ## Mine", "after"))).toEqual({ start: 0, end: 2 });
  });

  it("does not take a heading with four spaces before it as a heading", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "    ## Mine", "after"))).toEqual({ start: 0, end: 4 });
  });

  it("ends a section at a heading that is only hashes", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "##", "x"))).toEqual({ start: 0, end: 2 });
  });

  it("ends a section at a heading that is only hashes in a note with Windows line breaks", () => {
    expect(spanOf(["# a", INVENTORY, "- a", "##", "x"].join("\r\n"))).toEqual({ start: 1, end: 3 });
  });

  it("finds each section on its own", () => {
    const layout = NoteLayout.of(textOf(INVENTORY, "- a", SPELLS, "- b"));
    expect([startOf(layout, INVENTORY_SECTION), startOf(layout, SPELLS_SECTION), startOf(layout, NUMBERS_SECTION)]).toEqual([0, 2, null]);
  });

  it("refuses the same section twice, naming it", () => {
    expect(() => NoteLayout.of(textOf(INVENTORY, "- a", INVENTORY))).toThrow(`two "${INVENTORY}" sections`);
  });

  it("lists a section's lines without its heading and without its end blank lines", () => {
    expect(NoteLayout.of(textOf("Top", INVENTORY, "- a", "- b", "", "## Mine")).sectionLines(INVENTORY_SECTION)).toEqual(["- a", "- b"]);
  });

  it("lists no lines for a section the note has not got", () => {
    expect(NoteLayout.of("Top").sectionLines(INVENTORY_SECTION)).toEqual([]);
  });
});

describe("NoteLayout's code blocks", () => {
  it("does not look for a section inside a block fenced with backticks", () => {
    expect(spanOf(textOf("```", INVENTORY, "```"))).toBeNull();
  });

  it("does not look for a section inside a block fenced with tildes", () => {
    expect(spanOf(textOf("~~~", INVENTORY, "~~~"))).toBeNull();
  });

  it("looks again after the block closes", () => {
    expect(spanOf(textOf("```", "x", "```", INVENTORY))).toEqual({ start: 3, end: 4 });
  });

  it("does not close a block with a fence of the other kind", () => {
    expect(spanOf(textOf("```", "~~~", INVENTORY, "```"))).toBeNull();
  });

  it("does not close a block with a shorter fence", () => {
    expect(spanOf(textOf("````", "```", INVENTORY, "````"))).toBeNull();
  });

  it("closes a block with a longer fence", () => {
    expect(spanOf(textOf("```", "x", "`````", INVENTORY))).toEqual({ start: 3, end: 4 });
  });

  it("does not let a heading inside a block end the section it sits in", () => {
    expect(spanOf(textOf(INVENTORY, "```", "## inside", "```", "- a", "## Mine"))).toEqual({ start: 0, end: 5 });
  });

  it("does not take a fence with four spaces before it for a fence", () => {
    expect(spanOf(textOf("    ```", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("does not take two backticks for a fence", () => {
    expect(spanOf(textOf("``", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("does not take two tildes for a fence", () => {
    expect(spanOf(textOf("~~", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("refuses a note that ends inside a block that is never closed, in words of its own", () => {
    expect(() => NoteLayout.of(textOf("```", "x", "## Notes"))).toThrow("code block or comment that never closes");
  });
});

describe("NoteLayout's comments", () => {
  it("does not look for a section inside an HTML comment", () => {
    expect(spanOf(textOf("<!--", INVENTORY, "-->"))).toBeNull();
  });

  it("does not look for a section inside a comment between percent signs", () => {
    expect(spanOf(textOf("%%", INVENTORY, "%%"))).toBeNull();
  });

  it("looks again after an HTML comment closes", () => {
    expect(spanOf(textOf("<!--", "x", "-->", INVENTORY))).toEqual({ start: 3, end: 4 });
  });

  it("looks again after a comment between percent signs closes", () => {
    expect(spanOf(textOf("%%", "x", "%%", INVENTORY))).toEqual({ start: 3, end: 4 });
  });

  it("takes a comment that opens and closes on one line for text on both sides", () => {
    expect(spanOf(textOf("a <!-- x --> b", "x %% y %% z", INVENTORY))).toEqual({ start: 2, end: 3 });
  });

  it("takes a comment that closes in the middle of a line, and one that opens after it", () => {
    expect(spanOf(textOf("<!-- x", "--> y <!-- z", INVENTORY, "-->", INVENTORY))).toEqual({ start: 4, end: 5 });
  });

  it("does not take a heading inside a comment for the end of a section", () => {
    expect(spanOf(textOf(INVENTORY, "<!--", "## Mine", "-->", "- a"))).toEqual({ start: 0, end: 5 });
  });

  it("does not take a comment mark inside a code block for a comment", () => {
    expect(spanOf(textOf("```", "<!--", "```", INVENTORY))).toEqual({ start: 3, end: 4 });
  });

  it("refuses a note that ends inside an HTML comment that is never closed", () => {
    expect(() => NoteLayout.of(textOf("<!--", "x"))).toThrow("never closes");
  });

  it("refuses a note that ends inside a percent comment that is never closed", () => {
    expect(() => NoteLayout.of(textOf("a", "%% x"))).toThrow("never closes");
  });

  it("refuses a note whose comment opens again on the line where one closed", () => {
    expect(() => NoteLayout.of(textOf("<!-- a --> <!-- b"))).toThrow("never closes");
  });
});

describe("NoteLayout's properties", () => {
  it("starts the body after the properties block", () => {
    const layout = NoteLayout.of(textOf("---", "a: 1", "---", INVENTORY, "- a"));
    expect([layout.bodyStart, layout.propertyLines(), layout.bodyLines()]).toEqual([3, ["---", "a: 1", "---"], [INVENTORY, "- a"]]);
  });

  it("splits the block into its fences and what is inside", () => {
    const block = NoteLayout.of(textOf("---", "a: 1", "b: 2", "---", "body")).properties();
    if (block === null) throw new Error("The note has a properties block, so one should have been read.");
    expect([block.opening, block.inside, block.closing]).toEqual(["---", ["a: 1", "b: 2"], "---"]);
  });

  it("has no block when the note has no properties", () => {
    expect(NoteLayout.of("body").properties()).toBeNull();
  });

  it("does not look for sections among the properties", () => {
    expect(spanOf(textOf("---", INVENTORY, "---", "body"))).toBeNull();
  });

  it("has no property lines when there is no block", () => {
    expect(NoteLayout.of("body").propertyLines()).toEqual([]);
  });
});

describe("NoteLayout's size", () => {
  it("reads a note of exactly the most lines, with a section in it, without running out of stack", () => {
    const text = `${manyLines(MOST_NOTE_LINES - 3)}\n${INVENTORY}\n- a`;
    expect(spanOf(text)).toEqual({ start: MOST_NOTE_LINES - 3, end: MOST_NOTE_LINES - 1 });
  });

  it("refuses a note of one line more", () => {
    expect(() => NoteLayout.of(manyLines(MOST_NOTE_LINES + 1))).toThrow(`over ${MOST_NOTE_LINES} lines`);
  });

  it("refuses a note of a hundred and fifty thousand lines with a Refusal", () => {
    expect(() => NoteLayout.of(manyLines(150_000))).toThrow(Refusal);
  });
});
