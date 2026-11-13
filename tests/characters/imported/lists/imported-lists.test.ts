import { describe, expect, it } from "vitest";
import { ImportedLists } from "../../../../src/characters/imported/lists/imported-lists";
import { FEATURES_SECTION, INVENTORY_SECTION, PURSE_SECTION, SPELLS_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { importedNoteText } from "../../../../src/imports/note/writing/rewriting/imported-note";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { monkSheet, sheetWithCharacter, TODAY } from "../../../imports/builders/made-up-import";
import { textOf } from "../../../imports/builders/line-helpers";

function listsOf(text: string): ImportedLists {
  const lists = ImportedLists.of(text);
  if (lists === null) throw new Error("The note reads as not imported.");
  return lists;
}

function smallSheetNote(): string {
  const sheet = sheetWithCharacter(monkSheet(), { spells: [CleanLine.of("Fire Bolt")], features: [CleanLine.of("Open Hand")] });
  return importedNoteText(textOf("His own words.", "- Rope × 9", ""), { ...sheet, leftOut: { items: { tooLong: 1, notClean: 2 }, spells: { tooLong: 0, notClean: 0 }, features: { tooLong: 0, notClean: 0 } } }, TODAY);
}

describe("the lists an import wrote into a note", () => {
  it("are none for a note with no imported-from property", () => {
    expect(ImportedLists.of(textOf("---", "AC: 15", "---", "## Inventory (from D&D Beyond)", "- Rope", ""))).toBeNull();
  });

  it("are read back exactly as the writer wrote them", () => {
    const lists = listsOf(smallSheetNote());
    expect(lists.of(SPELLS_SECTION).entries).toEqual(["Fire Bolt"]);
    expect(lists.of(FEATURES_SECTION).entries).toEqual(["Open Hand"]);
    expect(lists.of(INVENTORY_SECTION).entries).toContain("Item 0 × 1");
    expect(lists.of(PURSE_SECTION).entries).toHaveLength(5);
  });

  it("read the left-out line apart from the entries", () => {
    const inventory = listsOf(smallSheetNote()).of(INVENTORY_SECTION);
    expect(inventory.leftOut).toEqual({ tooLong: 1, notClean: 2 });
    expect(inventory.entries).not.toContain("Left out: 1 too long, 2 not clean");
  });

  it("leave out his own bullets outside the sections", () => {
    expect(listsOf(smallSheetNote()).of(INVENTORY_SECTION).entries).not.toContain("Rope × 9");
  });

  it("leave out typed lines in a section that aren't bullets", () => {
    const text = textOf("---", "imported-from: pdf", "---", "## Spells (from D&D Beyond)", "- Fire Bolt", "Range: 60 feet", "");
    expect(listsOf(text).of(SPELLS_SECTION).entries).toEqual(["Fire Bolt"]);
  });

  it("are empty, with nothing left out, for a section the note doesn't have", () => {
    const text = textOf("---", "imported-from: pdf", "---", "");
    expect(listsOf(text).of(SPELLS_SECTION)).toEqual({ entries: [], leftOut: null });
  });

  it("know a PDF import from any other", () => {
    expect(listsOf(textOf("---", "imported-from: pdf", "---", "")).isFromPdf).toBe(true);
    expect(listsOf(textOf("---", "imported-from: online", "---", "")).isFromPdf).toBe(false);
  });
});
