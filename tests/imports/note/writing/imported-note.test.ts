import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { importedNoteText } from "../../../../src/imports/note/writing/imported-note";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { countOf, headingsOf, lineAfter, linesFrom, linesOf, linesStartingWith, textOf } from "../../builders/line-helpers";
import { monkSheet, sheetOf, TODAY } from "../../builders/made-up-import";

const NUMBERS = "## Numbers (from D&D Beyond)";
const INVENTORY = "## Inventory (from D&D Beyond)";
const SPELLS = "## Spells (from D&D Beyond)";
const FEATURES = "## Features (from D&D Beyond)";
const PURSE = "## Purse (from D&D Beyond)";


describe("importedNoteText for a note with nothing in it", () => {
  const written = importedNoteText("", monkSheet(), TODAY);

  it("starts with a properties block holding the import's marks and values", () => {
    expect(linesOf(written).slice(0, 14)).toEqual([
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
    expect(headingsOf(written)).toEqual([NUMBERS, INVENTORY, PURSE, SPELLS, FEATURES]);
  });

  it("ends with a line break", () => {
    expect(written.endsWith("\n")).toBe(true);
    expect(written.endsWith("\n\n")).toBe(false);
  });
});

describe("importedNoteText for a note that already has words of his own", () => {
  const current = textOf("---", 'carried from: "[[Other Campaign/Characters/Primary Monk]]"', "carried: [abilities, values]", "---", "His own words.", "AC: 10", "");

  it("keeps his properties and body lines exactly, in place", () => {
    const written = linesOf(importedNoteText(current, monkSheet(), TODAY));
    expect(written.slice(0, 3)).toEqual(["---", 'carried from: "[[Other Campaign/Characters/Primary Monk]]"', "carried: [abilities, values]"]);
    expect(written).toContain("His own words.");
    expect(written).toContain("AC: 10");
  });

  it("puts the import's properties after his, inside the same block", () => {
    const written = linesOf(importedNoteText(current, monkSheet(), TODAY));
    expect(written.slice(3, 5)).toEqual(["imported: 2026-11-13", "imported-from: pdf"]);
    expect(written.indexOf("---", 1)).toBeGreaterThan(written.indexOf("CHA: 16"));
  });

  it("adds the sections after his last line, with no blank line of its own before the first", () => {
    const written = linesOf(importedNoteText(current, monkSheet(), TODAY));
    expect(lineAfter(importedNoteText(current, monkSheet(), TODAY), "AC: 10")).toBe("");
    expect(written.indexOf(NUMBERS)).toBeGreaterThan(written.indexOf("AC: 10"));
  });
});

describe("importedNoteText for a note that was imported before", () => {
  const earlier = importedNoteText("His own words.\n", monkSheet(), "2026-01-02");
  const sheet = sheetOf(MadeUpSheet.monk().with("AC", "13"));
  const written = importedNoteText(earlier, sheet, TODAY);

  it("replaces each of the import's properties once", () => {
    expect([countOf(written, "AC: 13"), countOf(written, "AC: 18"), countOf(written, "imported: 2026-11-13"), countOf(written, "imported: 2026-01-02")]).toEqual([1, 0, 1, 0]);
  });

  it("writes each section once", () => {
    expect(headingsOf(written)).toEqual([NUMBERS, INVENTORY, PURSE, SPELLS, FEATURES]);
  });

  it("keeps his words", () => {
    expect(linesOf(written)).toContain("His own words.");
  });
});

describe("importedNoteText replacing a section in the middle of a note", () => {
  const current = textOf(
    "---",
    "AC: 10",
    "ac: 11",
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

  it("removes the old values of his own import properties, including a list under one, whatever the capitals", () => {
    expect(linesStartingWith(written, "ac:")).toEqual(["AC: 18"]);
    expect(written).not.toContain("- Rogue");
  });

  it("keeps a list under a property that is not the import's", () => {
    expect(linesOf(written)).toContain("tags:");
    expect(linesOf(written)).toContain("  - hero");
  });

  it("replaces the section where it stood, up to the next big heading, and nothing after", () => {
    const lines = linesOf(written);
    expect(lines).not.toContain("- Old rope × 9");
    expect(lines).not.toContain("typed by him");
    expect(lines).not.toContain("### a small heading he added");
    expect(lines.indexOf("Before.") + 1).toBe(lines.indexOf(INVENTORY));
    expect(linesFrom(written, "## His own heading", 2)).toEqual(["## His own heading", "After."]);
  });
});

describe("importedNoteText with a heading written inside a code block", () => {
  const current = textOf("```", INVENTORY, "- his example", "```", "End.");
  const written = importedNoteText(current, monkSheet(), TODAY);

  it("does not take the heading in the code block for a section", () => {
    expect(written).toContain(textOf("```", INVENTORY, "- his example", "```", "End."));
  });

  it("still adds its own section after it", () => {
    expect(countOf(written, INVENTORY)).toBe(2);
  });
});

describe("importedNoteText with a note that does not end in a line break", () => {
  it("adds the sections on the next line and ends with a line break", () => {
    const written = importedNoteText("His words.", monkSheet(), TODAY);
    expect(written).toContain(textOf("His words.", NUMBERS));
    expect(written.endsWith("\n")).toBe(true);
  });
});

describe("importedNoteText with a note that uses Windows line breaks", () => {
  const current = ["---", "carried: [abilities]", "---", "His words.", INVENTORY, "- Old rope × 9", "End.", ""].join("\r\n");
  const written = importedNoteText(current, monkSheet(), TODAY);

  it("writes every new line with a Windows line break too", () => {
    expect(written.replace(/\r\n/g, "").includes("\n")).toBe(false);
    expect(written.split("\r\n").length).toBeGreaterThan(20);
  });

  it("keeps his lines as they were", () => {
    expect(written).toContain(["His words.", INVENTORY].join("\r\n"));
    expect(written.endsWith("End.\r\n")).toBe(false);
  });

  it("replaces the old section's lines", () => {
    expect(written).not.toContain("Old rope");
  });
});

describe("importedNoteText when the import has nothing for a section", () => {
  const noSpells = sheetOf(MadeUpSheet.monk().without("SpellName8"));
  const empty = sheetOf(MadeUpSheet.monk());

  it("writes no heading for a section with no lines", () => {
    const bare = { ...empty, character: { ...empty.character, spells: [], features: [] } };
    const written = importedNoteText("", bare, TODAY);
    expect([written.includes(SPELLS), written.includes(FEATURES)]).toEqual([false, false]);
    expect(noSpells.character.spells.length).toBeGreaterThan(0);
  });

  it("removes a section the earlier import wrote and this one has nothing for", () => {
    const earlier = importedNoteText("", empty, "2026-01-02");
    const bare = { ...empty, character: { ...empty.character, spells: [] } };
    expect(importedNoteText(earlier, bare, TODAY)).not.toContain(SPELLS);
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
});

describe("importedNoteText for a note with no properties and Windows line breaks", () => {
  it("opens the new properties block with Windows line breaks too", () => {
    const written = importedNoteText("His words.\r\n", monkSheet(), TODAY);
    expect(written.startsWith("---\r\nimported: 2026-11-13\r\n")).toBe(true);
    expect(written.replace(/\r\n/g, "").split("\n").length - 1).toBe(1);
  });
});

describe("importedNoteText for a note whose last section is the import's", () => {
  it("still ends with a line break after a second import", () => {
    const earlier = importedNoteText("His words.\n", monkSheet(), "2026-01-02");
    const written = importedNoteText(earlier, sheetOf(MadeUpSheet.monk().with("AC", "13")), TODAY);
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
    expect(headingsOf(written).length).toBe(6);
  });
});
