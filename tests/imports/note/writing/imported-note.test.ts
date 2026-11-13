import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { MOST_NOTE_LINES, MOST_PROPERTY_LINE } from "../../../../src/imports/note/reading/note-limits";
import { importedNoteText } from "../../../../src/imports/note/writing/rewriting/imported-note";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import {
  countOf,
  firstLines,
  headingsOf,
  lineAfter,
  lineBefore,
  linesFrom,
  linesOf,
  linesStartingWith,
  manyLines,
  textOf,
} from "../../builders/line-helpers";
import { monkSheet, sheetOf, sheetWithCharacter, TODAY } from "../../builders/made-up-import";

const NUMBERS = "## Numbers (from D&D Beyond)";
const INVENTORY = "## Inventory (from D&D Beyond)";
const SPELLS = "## Spells (from D&D Beyond)";
const FEATURES = "## Features (from D&D Beyond)";
const PURSE = "## Purse (from D&D Beyond)";
const ALL_HEADINGS = [NUMBERS, INVENTORY, PURSE, SPELLS, FEATURES];

describe("importedNoteText for a note with nothing in it", () => {
  const written = importedNoteText("", monkSheet(), TODAY);

  it("starts with a properties block holding the import's marks and values", () => {
    expect(firstLines(linesOf(written), 14)).toEqual([
      "---",
      "imported: 2026-11-13",
      "imported-from: pdf",
      'class: "Monk 4"',
      'species: "Human"',
      "AC: 18",
      "HP: 51",
      "speed: 35",
      "STR: 11",
      "DEX: 12",
      "CON: 13",
      "INT: 14",
      "WIS: 15",
      "CHA: 16",
    ]);
  });

  it("closes the properties and then writes each section once, under its heading", () => {
    expect(headingsOf(written)).toEqual(ALL_HEADINGS);
  });

  it("ends with a line break, and not two", () => {
    expect(written.endsWith("\n")).toBe(true);
    expect(written.endsWith("\n\n")).toBe(false);
  });
});

describe("importedNoteText for a note that already has words of his own", () => {
  const current = textOf("---", 'carried from: "[[Other Campaign/Characters/Primary Monk]]"', "carried: [abilities, values]", "---", "His own words.", "AC: 10", "");
  const written = importedNoteText(current, monkSheet(), TODAY);

  it("keeps his properties exactly, in place, and puts the import's after them inside the same block", () => {
    expect(firstLines(linesOf(written), 5)).toEqual(["---", 'carried from: "[[Other Campaign/Characters/Primary Monk]]"', "carried: [abilities, values]", "imported: 2026-11-13", "imported-from: pdf"]);
  });

  it("keeps his body lines exactly, including one that looks like an import value", () => {
    expect(linesFrom(written, "His own words.", 2)).toEqual(["His own words.", "AC: 10"]);
  });

  it("adds the sections right after his last line and before the note's final line break", () => {
    expect(lineAfter(written, "AC: 10")).toBe(NUMBERS);
    expect(written.endsWith("\n")).toBe(true);
    expect(written.endsWith("\n\n")).toBe(false);
  });
});

describe("importedNoteText for a note that was imported before", () => {
  const earlier = importedNoteText("His own words.\n", monkSheet(), "2026-01-02");
  const written = importedNoteText(earlier, sheetOf(MadeUpSheet.monk().with("AC", "13")), TODAY);

  it("replaces each of the import's properties once", () => {
    expect([countOf(written, "AC: 13"), countOf(written, "AC: 18"), countOf(written, "imported: 2026-11-13"), countOf(written, "imported: 2026-01-02")]).toEqual([1, 0, 1, 0]);
  });

  it("writes each section once", () => {
    expect(headingsOf(written)).toEqual(ALL_HEADINGS);
  });

  it("keeps his words, and ends with one line break", () => {
    expect(linesOf(written)).toContain("His own words.");
    expect(written.endsWith("\n")).toBe(true);
    expect(written.endsWith("\n\n")).toBe(false);
  });
});

describe("importedNoteText for a note with words of his after every section", () => {
  it("keeps his last line as the last line, with nothing added after it", () => {
    const earlier = importedNoteText("", monkSheet(), "2026-01-02");
    const current = `${earlier}## His heading\nTail.\n`;
    const written = importedNoteText(current, sheetOf(MadeUpSheet.monk().with("AC", "13")), TODAY);
    expect(written.endsWith("## His heading\nTail.\n")).toBe(true);
    expect(headingsOf(written)).toEqual([...ALL_HEADINGS, "## His heading"]);
  });
});

describe("importedNoteText replacing a section in the middle of a note", () => {
  const current = textOf(
    "---",
    "AC: 10",
    "'HP': 4",
    '"speed": 20',
    "class:",
    "  - Rogue",
    "tags:",
    "  - hero",
    "---",
    "Before.",
    INVENTORY,
    "- Old rope × 9",
    "typed by him",
    "### a small heading he added",
    "",
    "## His own heading",
    "After.",
  );
  const written = importedNoteText(current, monkSheet(), TODAY);

  it("removes the old values of the import's properties, quoted or not, and a list under one", () => {
    expect(linesStartingWith(written, "AC:")).toEqual(["AC: 18"]);
    expect(linesStartingWith(written, "HP:")).toEqual(["HP: 51"]);
    expect(linesStartingWith(written, "speed:")).toEqual(["speed: 35"]);
    expect(written).not.toContain("- Rogue");
    expect(written).not.toContain("'HP'");
    expect(written).not.toContain('"speed"');
  });

  it("keeps a list under a property that is not the import's", () => {
    expect(linesFrom(written, "tags:", 2)).toEqual(["tags:", "  - hero"]);
  });

  it("replaces the section where it stood, up to the next big heading, and nothing after", () => {
    expect(linesOf(written)).not.toContain("- Old rope × 9");
    expect(linesOf(written)).not.toContain("typed by him");
    expect(linesOf(written)).not.toContain("### a small heading he added");
    expect(lineBefore(written, INVENTORY)).toBe("Before.");
  });

  it("keeps the blank line before his next heading, and everything after it", () => {
    expect(lineBefore(written, "## His own heading")).toBe("");
    expect(linesFrom(written, "## His own heading", 2)).toEqual(["## His own heading", "After."]);
  });
});

describe("importedNoteText with a property whose name only differs by capitals from the import's", () => {
  it.each([
    ["ac: 11", "ac", "AC"],
    ["Speed: 30", "Speed", "speed"],
    ["Hp: 3", "Hp", "HP"],
    ["Class: rogue", "Class", "class"],
  ])("refuses %j, naming it, so nothing of his is overwritten", (line, key, name) => {
    const current = textOf("---", line, "---", "words");
    expect(() => importedNoteText(current, monkSheet(), TODAY)).toThrow(`property called ${key}, which only differs by capitals from the import's ${name}`);
  });

  it("refuses it even when the exact name is there as well", () => {
    expect(() => importedNoteText(textOf("---", "AC: 1", "ac: 2", "---"), monkSheet(), TODAY)).toThrow(Refusal);
  });

  it("does not refuse a property that only starts like one of the import's", () => {
    const written = importedNoteText(textOf("---", "AC modifier: 2", "speedy: 1", "---"), monkSheet(), TODAY);
    expect(linesOf(written)).toContain("AC modifier: 2");
    expect(linesOf(written)).toContain("speedy: 1");
  });
});

describe("importedNoteText with a heading written inside a code block or a comment", () => {
  const fenced = textOf("```", INVENTORY, "- his example", "```", "End.");

  it("does not take the heading in the code block for a section, and adds its own after it", () => {
    const written = importedNoteText(fenced, monkSheet(), TODAY);
    expect(written).toContain(fenced);
    expect(countOf(written, INVENTORY)).toBe(2);
  });

  it("does not take the heading in an HTML comment for a section", () => {
    const current = textOf("<!--", INVENTORY, "- his example", "-->", "End.");
    const written = importedNoteText(current, monkSheet(), TODAY);
    expect(written).toContain(current);
    expect(countOf(written, INVENTORY)).toBe(2);
  });

  it("does not take the heading between percent signs for a section", () => {
    const current = textOf("%%", INVENTORY, "- his example", "%%", "End.");
    const written = importedNoteText(current, monkSheet(), TODAY);
    expect(written).toContain(current);
    expect(countOf(written, INVENTORY)).toBe(2);
  });

  it("refuses a note whose code block is never closed, rather than hide a section in it", () => {
    expect(() => importedNoteText(textOf("```", "x", "## Notes"), monkSheet(), TODAY)).toThrow("never closed");
  });

  it("refuses a note whose comment is never closed", () => {
    expect(() => importedNoteText(textOf("words", "<!-- x"), monkSheet(), TODAY)).toThrow("never closed");
    expect(() => importedNoteText(textOf("words", "%% x"), monkSheet(), TODAY)).toThrow("never closed");
  });
});

describe("importedNoteText with a note that does not end in a line break", () => {
  it("adds the sections on the next line and does not add a final line break", () => {
    const written = importedNoteText("His words.", monkSheet(), TODAY);
    expect(written).toContain(textOf("His words.", NUMBERS));
    expect(written.endsWith("\n")).toBe(false);
  });
});

describe("importedNoteText with a note that is only a properties block", () => {
  it("adds the sections after the block and does not add a final line break the note did not have", () => {
    const written = importedNoteText(textOf("---", "mood: calm", "---"), monkSheet(), TODAY);
    expect(written).toContain(textOf("---", NUMBERS));
    expect(written.endsWith("\n")).toBe(false);
  });

  it("adds the sections after the block and keeps the final line break the note had", () => {
    const written = importedNoteText(textOf("---", "mood: calm", "---", ""), monkSheet(), TODAY);
    expect(written.endsWith("\n")).toBe(true);
    expect(written.endsWith("\n\n")).toBe(false);
  });
});

describe("importedNoteText with a note that uses Windows line breaks", () => {
  const current = ["---", "carried: [abilities]", "---", "His words.", INVENTORY, "- Old rope × 9", "", "## End", "Tail.", ""].join("\r\n");
  const written = importedNoteText(current, monkSheet(), TODAY);

  it("writes every new line with a Windows line break too", () => {
    expect(written.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });

  it("keeps his lines as they were, and replaces the old section's lines", () => {
    expect(written).toContain(["His words.", INVENTORY].join("\r\n"));
    expect(written).toContain(["## End", "Tail.", NUMBERS].join("\r\n"));
    expect(written).not.toContain("Old rope");
  });

  it("opens a new properties block with Windows line breaks when the note had none", () => {
    const bare = importedNoteText("His words.\r\n", monkSheet(), TODAY);
    expect(bare.startsWith("---\r\nimported: 2026-11-13\r\n")).toBe(true);
    expect(bare.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });
});

describe("importedNoteText when the import has nothing for a section", () => {
  const bare = sheetWithCharacter(monkSheet(), { spells: [], features: [] });

  it("writes no heading for a section with no lines", () => {
    const written = importedNoteText("", bare, TODAY);
    expect([written.includes(SPELLS), written.includes(FEATURES)]).toEqual([false, false]);
  });

  it("removes a section the earlier import wrote and this one has nothing for", () => {
    const earlier = importedNoteText("", monkSheet(), "2026-01-02");
    expect(importedNoteText(earlier, sheetWithCharacter(monkSheet(), { spells: [] }), TODAY)).not.toContain(SPELLS);
  });

  it("writes no class property when the character has no class", () => {
    const written = importedNoteText("", sheetWithCharacter(monkSheet(), { classes: [] }), TODAY);
    expect(linesStartingWith(written, "class:")).toEqual([]);
  });
});

describe("importedNoteText refusing", () => {
  const twice = textOf(INVENTORY, "- a", INVENTORY, "- b");

  it("a note with the same plugin heading twice, naming the heading", () => {
    expect(() => importedNoteText(twice, monkSheet(), TODAY)).toThrow(Refusal);
    expect(() => importedNoteText(twice, monkSheet(), TODAY)).toThrow(INVENTORY);
  });

  it.each(["2026-1-3", "13 November", "", "2026-11-13T10:00", "2026-11-13\n"])("a date that is not year-month-day: %j", (today) => {
    expect(() => importedNoteText("", monkSheet(), today)).toThrow(Refusal);
  });

  it("a property line longer than the most it reads", () => {
    const current = textOf("---", `mood: ${" ".repeat(MOST_PROPERTY_LINE)}`, "---");
    expect(() => importedNoteText(current, monkSheet(), TODAY)).toThrow(`longer than ${MOST_PROPERTY_LINE} characters`);
  });
});

describe("importedNoteText on a big note", () => {
  it("writes into a note of exactly the most lines without running out of stack", () => {
    const current = `${manyLines(MOST_NOTE_LINES - 1)}\n`;
    const written = importedNoteText(current, monkSheet(), TODAY);
    expect(headingsOf(written)).toEqual(ALL_HEADINGS);
    expect(written).toContain("Line 99998");
  });

  it("refuses a note of a hundred and fifty thousand lines with a Refusal, stating the most", () => {
    expect(() => importedNoteText(manyLines(150_000), monkSheet(), TODAY)).toThrow(`more than ${MOST_NOTE_LINES} lines`);
  });

  it("replaces a section in a note that is nearly the most lines", () => {
    const earlier = importedNoteText(`${manyLines(MOST_NOTE_LINES - 300)}\n`, monkSheet(), "2026-01-02");
    expect(headingsOf(importedNoteText(earlier, monkSheet(), TODAY))).toEqual(ALL_HEADINGS);
  });
});
