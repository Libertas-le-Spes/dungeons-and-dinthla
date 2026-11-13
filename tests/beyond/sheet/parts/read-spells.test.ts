import { describe, expect, it } from "vitest";
import { spellsOf } from "../../../../src/beyond/sheet/parts/read-spells";
import type { ReadLines } from "../../../../src/beyond/sheet/lines/read-lines";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet, SPELL_FIELD_NAMES } from "../../builders/made-up-sheet";
import { manyLines, textsOf } from "../../builders/sheet-reading";

function spellsOfSheet(sheet: MadeUpSheet): ReadLines {
  return spellsOf(new SheetFields(sheet.fields()));
}

function namedSpell(name: string): string {
  return `Spell of ${name}`;
}

describe("the spells of a sheet", () => {
  it("are one for each row that holds a name, in the order of the rows", () => {
    expect(textsOf(spellsOfSheet(MadeUpSheet.monk()).lines)).toEqual(SPELL_FIELD_NAMES.map(namedSpell));
  });

  it("are as many as there are rows, forty-seven", () => {
    expect(spellsOfSheet(MadeUpSheet.monk()).lines).toHaveLength(47);
  });

  it("leave out a blank row and one with no text without counting them, and keep the rest", () => {
    const sheet = MadeUpSheet.empty().with("spellName0", " ").with("spellName1", true).with("spellName3", "Primary Light");
    const found = spellsOfSheet(sheet);
    expect([textsOf(found.lines), found.loss]).toEqual([["Primary Light"], { tooLong: 0, notClean: 0 }]);
  });

  it.each([101, 301])("count a spell name of %i characters as too long and leave it out", (length) => {
    const found = spellsOfSheet(MadeUpSheet.empty().with("spellName2", "x".repeat(length)).with("spellName3", "Primary Light"));
    expect([textsOf(found.lines), found.loss]).toEqual([["Primary Light"], { tooLong: 1, notClean: 0 }]);
  });

  it("keep a spell name of 100 characters", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellName2", "x".repeat(100))).loss).toEqual({ tooLong: 0, notClean: 0 });
  });

  it("count a spell name that is only markup as not clean", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellName2", "<br>")).loss).toEqual({ tooLong: 0, notClean: 1 });
  });

  it("list a spell once when two rows name it", () => {
    const sheet = MadeUpSheet.empty().with("spellName0", "Primary Light").with("SpellName9", "Primary Light");
    expect(textsOf(spellsOfSheet(sheet).lines)).toEqual(["Primary Light"]);
  });

  it("do not read the other columns of a spell row", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellSource0", "Secondary Book").with("spellNotes0", "Secondary Note")).lines).toEqual([]);
  });

  it("are exactly five hundred lines when a row holds five hundred", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellName0", manyLines(500))).lines).toHaveLength(500);
  });

  it("are refused when a row holds five hundred and one lines", () => {
    expect(() => spellsOfSheet(MadeUpSheet.empty().with("spellName0", manyLines(501)))).toThrow("The list of spells is over the limit of 500 spells.");
  });

  it("are refused when a row is over 8,000 characters", () => {
    expect(() => spellsOfSheet(MadeUpSheet.empty().with("spellName0", "x".repeat(8001)))).toThrow("A list field of the sheet is over the limit");
  });
});
