import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import {
  changesNothing,
  importChangesOf,
  type PropertyChange,
  type SectionChange,
  type TypedText,
} from "../../../../src/imports/note/changes/import-changes";
import { linesWithout } from "../../../../src/imports/note/changes/line-difference";
import { sameTypedText } from "../../../../src/imports/note/changes/same-typed-text";
import { importedNoteText } from "../../../../src/imports/note/writing/rewriting/imported-note";
import { INVENTORY_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { lineAt, textOf } from "../../builders/line-helpers";
import { monkSheet, sheetOf, sheetWithCharacter, TODAY , stampedOn } from "../../builders/made-up-import";

const NUMBERS = "## Numbers";
const INVENTORY = "## Inventory";
const SPELLS = "## Spells";
const NUMBERS_TITLE = "Numbers";
const INVENTORY_TITLE = "Inventory";
const SPELLS_TITLE = "Spells";

function importedWith(made: MadeUpSheet, date = "2026-01-02"): string {
  return importedNoteText({ current: "His words.\n", sheet: sheetOf(made), stamp: stampedOn(date) });
}

function nameOf(change: PropertyChange): string {
  return change.name;
}

function titleOf(change: SectionChange): string {
  return change.title;
}

function isNotAdded(change: PropertyChange): boolean {
  if (change.before !== null) return true;
  return change.after === null;
}

function isNotOnlyAdded(change: SectionChange): boolean {
  if (change.removed.length > 0) return true;
  return change.added.length === 0;
}

function titleAndAdded(change: SectionChange): [string, number] {
  return [change.title, change.added.length];
}

function sectionNamed(changes: readonly SectionChange[], title: string): SectionChange {
  for (const change of changes) {
    if (change.title === title) return change;
  }
  throw new Error(`No change for ${title}.`);
}

describe("linesWithout", () => {
  it("keeps the lines that are not in the other list", () => {
    expect(linesWithout(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });

  it("takes one line away for each line in the other list, so a repeated line counts", () => {
    expect(linesWithout(["a", "a", "a"], ["a"])).toEqual(["a", "a"]);
  });

  it("keeps all of them for an empty other list", () => {
    expect(linesWithout(["a", "b"], [])).toEqual(["a", "b"]);
  });
});

describe("sameTypedText", () => {
  const one: TypedText[] = [{ title: INVENTORY_TITLE, lines: ["a", "b"] }];

  it("is the same for two empty lists", () => {
    expect(sameTypedText([], [])).toBe(true);
  });

  it("is the same for the same title and lines", () => {
    expect(sameTypedText(one, [{ title: INVENTORY_TITLE, lines: ["a", "b"] }])).toBe(true);
  });

  it("differs when one list has more entries", () => {
    expect(sameTypedText(one, [])).toBe(false);
    expect(sameTypedText([], one)).toBe(false);
  });

  it("differs when the title differs", () => {
    expect(sameTypedText(one, [{ title: SPELLS_TITLE, lines: ["a", "b"] }])).toBe(false);
  });

  it("differs when a line differs, or one is added or missing", () => {
    expect(sameTypedText(one, [{ title: INVENTORY_TITLE, lines: ["a", "c"] }])).toBe(false);
    expect(sameTypedText(one, [{ title: INVENTORY_TITLE, lines: ["a"] }])).toBe(false);
    expect(sameTypedText(one, [{ title: INVENTORY_TITLE, lines: ["a", "b", "c"] }])).toBe(false);
  });

  it("differs when the lines are in another order", () => {
    expect(sameTypedText(one, [{ title: INVENTORY_TITLE, lines: ["b", "a"] }])).toBe(false);
  });
});

describe("importChangesOf for a note that was never imported", () => {
  const changes = importChangesOf("His words.\n", importedWith(MadeUpSheet.monk()));

  it("lists each property the import writes as added, except the date", () => {
    expect(changes.properties.map(nameOf)).toEqual(["imported-from", "imported-session", "class", "species", "type", "subtitle", "AC", "HP", "speed", "alignment", "STR", "DEX", "CON", "INT", "WIS", "CHA"]);
    expect(changes.properties.filter(isNotAdded)).toEqual([]);
  });

  it("lists each section as added, with no line removed", () => {
    expect(changes.sections.map(titleOf).length).toBe(5);
    expect(changes.sections.filter(isNotOnlyAdded)).toEqual([]);
  });

  it("finds no typed text", () => {
    expect(changes.typed).toEqual([]);
  });
});

describe("importChangesOf for a changed value", () => {
  const before = importedWith(MadeUpSheet.monk());
  const after = importedWith(MadeUpSheet.monk().with("AC", "13").with("Eq Qty1", "7"));
  const changes = importChangesOf(before, after);

  it("names the property with what it was and what it will be", () => {
    expect(changes.properties).toEqual([{ name: "AC", before: "18", after: "13" }]);
  });

  it("names the lines that go and the lines that come, section by section", () => {
    expect(changes.sections.map(titleOf)).toEqual([NUMBERS_TITLE, INVENTORY_TITLE]);
    expect(sectionNamed(changes.sections, INVENTORY_TITLE)).toEqual({ title: INVENTORY_TITLE, removed: ["- Item 1 × 2"], added: ["- Item 1 × 7"] });
  });

  it("does not count a new date alone as a change", () => {
    expect(changesNothing(importChangesOf(before, importedWith(MadeUpSheet.monk(), TODAY)))).toBe(true);
  });
});

describe("importChangesOf for typed text", () => {
  const typed = textOf("---", "imported-from: pdf", "---", "His words.", INVENTORY, "- Old rope × 2", "I gave the gold to a friend", "", SPELLS, "- Light", "my own spell note", "### a heading");
  const changes = importChangesOf(typed, importedNoteText({ current: typed, sheet: monkSheet(), stamp: stampedOn(TODAY) }));

  it("lists a line in a section that is not one of the plugin's bullet lines, per section", () => {
    expect(changes.typed).toEqual([
      { title: INVENTORY_TITLE, lines: ["I gave the gold to a friend"] },
      { title: SPELLS_TITLE, lines: ["my own spell note", "### a heading"] },
    ]);
  });

  it("lists the typed lines among the lines that will go", () => {
    expect(sectionNamed(changes.sections, INVENTORY_TITLE).removed).toContain("I gave the gold to a friend");
  });

  it("does not take a blank line for typed text", () => {
    const withBlank = textOf("---", "imported-from: pdf", "---", INVENTORY, "- a", "", "typed words", "", "more words");
    const found = importChangesOf(withBlank, importedNoteText({ current: withBlank, sheet: monkSheet(), stamp: stampedOn(TODAY) }));
    expect(found.typed).toEqual([{ title: INVENTORY_TITLE, lines: ["typed words", "more words"] }]);
    expect(sectionNamed(found.sections, INVENTORY_TITLE).removed).toEqual(["- a", "typed words", "more words"]);
  });

  it("finds typed text in a section even when the import has nothing for that section", () => {
    const bare = sheetWithCharacter(monkSheet(), { spells: [] });
    expect(importChangesOf(typed, importedNoteText({ current: typed, sheet: bare, stamp: stampedOn(TODAY) })).typed.length).toBe(2);
  });
});

describe("importChangesOf for a note the import has not written to yet", () => {
  const own = textOf("His words.", INVENTORY, "- My rope × 2", "", SPELLS, "- My light", "## Features", "My own prose");
  const changes = importChangesOf(own, importedNoteText({ current: own, sheet: monkSheet(), stamp: stampedOn(TODAY) }));

  it("takes every line under a plain heading of his, bullets too, for typed text", () => {
    expect(changes.typed).toEqual([
      { title: INVENTORY_TITLE, lines: ["- My rope × 2"] },
      { title: SPELLS_TITLE, lines: ["- My light"] },
      { title: "Features", lines: ["My own prose"] },
    ]);
  });

  it("takes the bullets for the import's once the note has the imported-from property", () => {
    const marked = textOf("---", "imported-from: pdf", "---", INVENTORY, "- My rope × 2");
    expect(importChangesOf(marked, importedNoteText({ current: marked, sheet: monkSheet(), stamp: stampedOn(TODAY) })).typed).toEqual([]);
  });

  it("takes the bullets for the import's once the note has an older heading", () => {
    const older = textOf(INVENTORY_SECTION.formerHeading, "- Rope × 2");
    expect(importChangesOf(older, importedNoteText({ current: older, sheet: monkSheet(), stamp: stampedOn(TODAY) })).typed).toEqual([]);
  });
});

describe("importChangesOf for notes written in other ways", () => {
  it("reads a property written with a quoted key as the import's", () => {
    const before = textOf("---", '"AC": 3', "---", "x");
    const after = textOf("---", "AC: 18", "---", "x");
    expect(importChangesOf(before, after).properties).toEqual([{ name: "AC", before: "3", after: "18" }]);
  });

  it("refuses a property that differs only by capitals from the import's", () => {
    expect(() => importChangesOf(textOf("---", "ac: 3", "---"), textOf("---", "AC: 18", "---"))).toThrow(Refusal);
  });

  it("gives the lines of a note with Windows line breaks without their returns", () => {
    const before = ["---", "imported-from: pdf", "---", "x", INVENTORY, "- Old rope × 2", "typed", ""].join("\r\n");
    const changes = importChangesOf(before, importedNoteText({ current: before, sheet: monkSheet(), stamp: stampedOn(TODAY) }));
    expect(sectionNamed(changes.sections, INVENTORY_TITLE).removed).toEqual(["- Old rope × 2", "typed"]);
    expect(changes.typed).toEqual([{ title: INVENTORY_TITLE, lines: ["typed"] }]);
  });

  it("lists a section whose lines only go, when the import has nothing for it", () => {
    const before = importedNoteText({ current: "", sheet: monkSheet(), stamp: stampedOn("2026-01-02") });
    const changes = importChangesOf(before, importedNoteText({ current: before, sheet: sheetWithCharacter(monkSheet(), { spells: [] }), stamp: stampedOn(TODAY) }));
    expect(changes.sections.map(titleAndAdded)).toEqual([[SPELLS_TITLE, 0]]);
    expect(lineAt(sectionNamed(changes.sections, SPELLS_TITLE).removed, 0)).toBe("- Spell of spellName0");
  });

  it("is not nothing when only a section's lines change", () => {
    const before = importedWith(MadeUpSheet.monk());
    const changes = importChangesOf(before, importedWith(MadeUpSheet.monk().with("Eq Qty1", "7")));
    expect([changes.properties.length, changesNothing(changes)]).toEqual([0, false]);
  });
});

describe("importChangesOf for a note the import does not change", () => {
  it("has no property or section change", () => {
    const text = importedWith(MadeUpSheet.monk());
    expect(changesNothing(importChangesOf(text, text))).toBe(true);
  });

  it("has a change when only a property changes", () => {
    const changes = importChangesOf(importedWith(MadeUpSheet.monk()), importedWith(MadeUpSheet.monk().with("Speed", "30")));
    expect([changes.properties.length, changes.sections.length > 0, changesNothing(changes)]).toEqual([1, true, false]);
  });

  it("refuses a note with a plugin section twice", () => {
    expect(() => importChangesOf(textOf(INVENTORY, INVENTORY), "x")).toThrow(Refusal);
  });
});

describe("importChangesOf for a type property of his", () => {
  it("shows the property he wrote, in any capitals, as replaced by the import's", () => {
    const before = textOf("---", "Type: character", "---", "words");
    const changes = importChangesOf(before, importedNoteText({ current: before, sheet: monkSheet(), stamp: stampedOn(TODAY) }));
    expect(changes.properties.find((change) => change.name === "type")).toEqual({ name: "type", before: "character", after: '"Medium (human), neutral"' });
  });
});
