import { describe, expect, it } from "vitest";
import { spellsOf } from "../../../../src/beyond/sheet/parts/read-spells";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet, SPELL_FIELD_NAMES } from "../../builders/made-up-sheet";

function spellsOfSheet(sheet: MadeUpSheet): string[] {
  return spellsOf(new SheetFields(sheet.fields())).map(textOf);
}

function textOf(line: { text: string }): string {
  return line.text;
}

function manyLines(count: number): string {
  return Array.from({ length: count }, lineNumber).join("\n");
}

function lineNumber(_unused: unknown, position: number): string {
  return `Spell ${position}`;
}

describe("the spells of a sheet", () => {
  it("are one for each row that holds a name, in the order of the rows", () => {
    expect(spellsOfSheet(MadeUpSheet.monk())).toEqual(SPELL_FIELD_NAMES.map(namedSpell));
  });

  it("are as many as there are rows, forty-seven", () => {
    expect(spellsOfSheet(MadeUpSheet.monk())).toHaveLength(47);
  });

  it("leave out a blank row, one with no text and one too long, and keep the rest", () => {
    const sheet = MadeUpSheet.empty().with("spellName0", " ").with("spellName1", true).with("spellName2", "x".repeat(101)).with("spellName3", "Primary Light");
    expect(spellsOfSheet(sheet)).toEqual(["Primary Light"]);
  });

  it("list a spell once when two rows name it", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellName0", "Primary Light").with("SpellName9", "Primary Light"))).toEqual(["Primary Light"]);
  });

  it("do not read the other columns of a spell row", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellSource0", "Secondary Book").with("spellNotes0", "Secondary Note"))).toEqual([]);
  });

  it("are exactly five hundred lines when a row holds five hundred", () => {
    expect(spellsOfSheet(MadeUpSheet.empty().with("spellName0", manyLines(500)))).toHaveLength(500);
  });

  it("are refused when a row holds five hundred and one lines", () => {
    expect(() => spellsOfSheet(MadeUpSheet.empty().with("spellName0", manyLines(501)))).toThrow("The list of spells is over the limit of 500 spells.");
  });
});

function namedSpell(name: string): string {
  return `Spell of ${name}`;
}
