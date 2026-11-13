import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { INVENTORY_SECTION, NUMBERS_SECTION, SPELLS_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { NoteLayout } from "../../../../src/imports/note/reading/note-layout";
import { textOf } from "../../builders/line-helpers";

const INVENTORY = INVENTORY_SECTION.heading;
const SPELLS = SPELLS_SECTION.heading;

function spanOf(text: string, section = INVENTORY_SECTION): { start: number; end: number } | null {
  const span = NoteLayout.of(text).spanOf(section);
  if (span === null) return null;
  return { start: span.start, end: span.end };
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

  it("runs the last section to the end of the note, including its final empty line", () => {
    expect(spanOf(textOf("Top", INVENTORY, "- a", ""))).toEqual({ start: 1, end: 4 });
  });

  it("takes a heading that has spaces after it for the section's heading", () => {
    expect(spanOf(textOf(`${INVENTORY}  `, "- a"))).toEqual({ start: 0, end: 2 });
  });

  it("does not take a heading with other words, a different level or spaces before it for the section's", () => {
    const near = textOf("## Inventory", "# Inventory (from D&D Beyond)", `### Inventory (from D&D Beyond)`, ` ${INVENTORY}x`);
    expect(spanOf(near)).toBeNull();
  });

  it("takes a heading with up to three spaces before it as a heading, so it ends a section", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "   ## Mine", "after"))).toEqual({ start: 0, end: 2 });
  });

  it("does not take a heading with four spaces before it as a heading", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "    ## Mine", "after"))).toEqual({ start: 0, end: 4 });
  });

  it("finds each section on its own", () => {
    const layout = NoteLayout.of(textOf(INVENTORY, "- a", SPELLS, "- b"));
    expect([layout.spanOf(INVENTORY_SECTION)?.start, layout.spanOf(SPELLS_SECTION)?.start, layout.spanOf(NUMBERS_SECTION)]).toEqual([0, 2, null]);
  });

  it("refuses the same section twice", () => {
    expect(() => NoteLayout.of(textOf(INVENTORY, "- a", INVENTORY))).toThrow(Refusal);
  });

  it("lists a section's lines without its heading", () => {
    expect(NoteLayout.of(textOf("Top", INVENTORY, "- a", "- b", "## Mine")).sectionLines(INVENTORY_SECTION)).toEqual(["- a", "- b"]);
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
});

describe("NoteLayout's properties", () => {
  it("starts the body after the properties block", () => {
    const layout = NoteLayout.of(textOf("---", "a: 1", "---", INVENTORY, "- a"));
    expect([layout.bodyStart, layout.propertyLines(), layout.bodyLines()]).toEqual([3, ["---", "a: 1", "---"], [INVENTORY, "- a"]]);
  });

  it("does not look for sections among the properties", () => {
    expect(spanOf(textOf("---", INVENTORY, "---", "body"))).toBeNull();
  });

  it("has no property lines when there is no block", () => {
    expect(NoteLayout.of("body").propertyLines()).toEqual([]);
  });
});

describe("NoteLayout's fences and bare headings", () => {
  it("does not take a fence with four spaces before it for a fence", () => {
    expect(spanOf(textOf("    ```", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("does not take two backticks for a fence", () => {
    expect(spanOf(textOf("``", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("does not take two tildes for a fence", () => {
    expect(spanOf(textOf("~~", INVENTORY))).toEqual({ start: 1, end: 2 });
  });

  it("ends a section at a heading that is only hashes", () => {
    expect(spanOf(textOf(INVENTORY, "- a", "##", "x"))).toEqual({ start: 0, end: 2 });
  });

  it("ends a section at a heading that is only hashes in a note with Windows line breaks", () => {
    expect(spanOf(["# a", INVENTORY, "- a", "##", "x"].join("\r\n"))).toEqual({ start: 1, end: 3 });
  });
});
