import { describe, expect, it } from "vitest";
import { ImportedLists } from "../../../../src/characters/imported/lists/imported-lists";
import { FEATURES_SECTION, INVENTORY_SECTION, PURSE_SECTION, SPELLS_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { importedNoteText } from "../../../../src/imports/note/writing/rewriting/imported-note";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { monkSheet, sheetWithCharacter, TODAY , stampedOn } from "../../../imports/builders/made-up-import";
import { textOf } from "../../../imports/builders/line-helpers";
import { STUB_SYNTAX } from "../../../host/stub-syntax";

function listsOf(text: string): ImportedLists {
  const lists = ImportedLists.of(text, STUB_SYNTAX);
  if (lists === null) throw new Error("The note reads as not imported.");
  return lists;
}

function smallSheetNote(): string {
  const sheet = sheetWithCharacter(monkSheet(), { spells: [CleanLine.of("Fire Bolt")], features: [CleanLine.of("Open Hand")] });
  return importedNoteText({ current: textOf("His own words.", "- Rope × 9", ""), sheet: { ...sheet, leftOut: { items: { tooLong: 1, notClean: 2 }, spells: { tooLong: 0, notClean: 0 }, features: { tooLong: 0, notClean: 0 } } }, stamp: stampedOn(TODAY) }, STUB_SYNTAX);
}

describe("the lists an import wrote into a note", () => {
  it("are none for a note with no imported-from property", () => {
    expect(ImportedLists.of(textOf("---", "AC: 15", "---", "## Inventory", "- Rope", ""), STUB_SYNTAX)).toBeNull();
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
    const text = textOf("---", "imported-from: pdf", "---", "## Spells", "- Fire Bolt", "Range: 60 feet", "");
    expect(listsOf(text).of(SPELLS_SECTION).entries).toEqual(["Fire Bolt"]);
  });

  it("are empty, with nothing left out, for a section the note doesn't have", () => {
    const text = textOf("---", "imported-from: pdf", "---", "");
    expect(listsOf(text).of(SPELLS_SECTION)).toEqual({ present: false, entries: [], leftOut: null });
  });

  it("say a section is there when its heading is, even with nothing under it", () => {
    const text = textOf("---", "imported-from: pdf", "---", "## Spells", "");
    expect(listsOf(text).of(SPELLS_SECTION)).toEqual({ present: true, entries: [], leftOut: null });
  });
});
