import { describe, expect, it } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { changesNothing, importChangesOf } from "../../../../src/imports/note/changes/import-changes";
import { linesWithout } from "../../../../src/imports/note/changes/line-difference";
import { importedNoteText } from "../../../../src/imports/note/writing/imported-note";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { textOf } from "../../builders/line-helpers";
import { monkSheet, sheetOf, TODAY } from "../../builders/made-up-import";

const INVENTORY = "## Inventory (from D&D Beyond)";
const SPELLS = "## Spells (from D&D Beyond)";

function importedWith(made: MadeUpSheet, date = "2026-01-02"): string {
  return importedNoteText("His words.\n", sheetOf(made), date);
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

describe("importChangesOf for a note that was never imported", () => {
  const changes = importChangesOf("His words.\n", importedWith(MadeUpSheet.monk()));

  it("lists each property the import writes as added, except the date", () => {
    expect(changes.properties.map((change) => change.name)).toEqual(["imported-from", "class", "species", "AC", "HP", "speed", "STR", "DEX", "CON", "INT", "WIS", "CHA"]);
    expect(changes.properties.every((change) => change.before === null && change.after !== null)).toBe(true);
  });

  it("lists each section as added, with no line removed", () => {
    expect(changes.sections.map((change) => change.heading).length).toBe(5);
    expect(changes.sections.every((change) => change.removed.length === 0 && change.added.length > 0)).toBe(true);
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
    const heading = changes.sections.map((change) => change.heading);
    expect(heading).toEqual(["## Numbers (from D&D Beyond)", INVENTORY]);
    expect(changes.sections[1]).toEqual({ heading: INVENTORY, removed: ["- Item 1 × 2"], added: ["- Item 1 × 7"] });
  });

  it("does not count a new date alone as a change", () => {
    expect(changesNothing(importChangesOf(before, importedWith(MadeUpSheet.monk(), TODAY)))).toBe(true);
  });
});

describe("importChangesOf for typed text", () => {
  const typed = textOf("His words.", INVENTORY, "- Old rope × 2", "I gave the gold to Sam", "", SPELLS, "- Light", "my own spell note", "### a heading");
  const changes = importChangesOf(typed, importedNoteText(typed, monkSheet(), TODAY));

  it("lists a line in a section that is not one of the plugin's bullet lines, per section", () => {
    expect(changes.typed).toEqual([
      { heading: INVENTORY, lines: ["I gave the gold to Sam"] },
      { heading: SPELLS, lines: ["my own spell note", "### a heading"] },
    ]);
  });

  it("lists the typed lines among the lines that will go", () => {
    expect(changes.sections[1]!.removed).toContain("I gave the gold to Sam");
  });

  it("does not take a blank line for typed text", () => {
    expect(JSON.stringify(changes.typed)).not.toContain('""');
  });

  it("finds typed text in a section even when the import has nothing for that section", () => {
    const bare = { ...monkSheet(), character: { ...monkSheet().character, spells: [] } };
    expect(importChangesOf(typed, importedNoteText(typed, bare, TODAY)).typed.length).toBe(2);
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

describe("importChangesOf for notes written in other ways", () => {
  it("reads a property written in other capitals as the import's", () => {
    const before = textOf("---", "ac: 3", "---", "x");
    const after = textOf("---", "AC: 18", "---", "x");
    expect(importChangesOf(before, after).properties).toEqual([{ name: "AC", before: "3", after: "18" }]);
  });

  it("gives the lines of a note with Windows line breaks without their returns", () => {
    const before = ["x", INVENTORY, "- Old rope × 2", "typed", ""].join("\r\n");
    const changes = importChangesOf(before, importedNoteText(before, monkSheet(), TODAY));
    const inventory = changes.sections.find((change) => change.heading === INVENTORY)!;
    expect(inventory.removed).toEqual(["- Old rope × 2", "typed"]);
    expect(changes.typed).toEqual([{ heading: INVENTORY, lines: ["typed"] }]);
  });

  it("lists a section whose lines only go, when the import has nothing for it", () => {
    const before = importedNoteText("", monkSheet(), "2026-01-02");
    const bare = { ...monkSheet(), character: { ...monkSheet().character, spells: [] } };
    const changes = importChangesOf(before, importedNoteText(before, bare, TODAY));
    expect(changes.sections.map((change) => [change.heading, change.added.length])).toEqual([[SPELLS, 0]]);
    expect(changes.sections[0]!.removed.length).toBeGreaterThan(0);
  });

  it("is not nothing when only a section's lines change", () => {
    const before = importedWith(MadeUpSheet.monk());
    const changes = importChangesOf(before, importedWith(MadeUpSheet.monk().with("Eq Qty1", "7")));
    expect([changes.properties.length, changesNothing(changes)]).toEqual([0, false]);
  });
});
