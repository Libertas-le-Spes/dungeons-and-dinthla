import { describe, expect, it } from "vitest";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { readOf, unknownNames, valueNamed } from "../../builders/sheet-reading";
import { SHEET_NUMBERS } from "../../builders/sheet-numbers";

function isPlainNumber(row: { print: (value: number) => string }): boolean {
  return row.print(1) === "1";
}

describe("reading a sheet with hostile numbers", () => {
  it.each(SHEET_NUMBERS)("has only $name not known when $field holds a number out of range", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "99999")))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has $name known at its lowest and its highest, as $field prints them", ({ field, name, lowest, highest, print }) => {
    const atLowest = valueNamed(readOf(MadeUpSheet.monk().with(field, print(lowest))), name);
    const atHighest = valueNamed(readOf(MadeUpSheet.monk().with(field, print(highest))), name);
    expect([atLowest, atHighest]).toEqual([lowest, highest]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known one above its highest in $field", ({ field, name, highest, print }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, print(highest + 1))))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known one below its lowest in $field", ({ field, name, lowest, print }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, print(lowest - 1))))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known when $field holds 1e999", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "1e999")))).toEqual([name]);
  });

  it.each(SHEET_NUMBERS)("has only $name not known when $field holds words", ({ field, name }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, "twelve")))).toEqual([name]);
  });

  it("has a negative zero not known wherever a sign is allowed", () => {
    const character = readOf(MadeUpSheet.monk().with("Init", "-0").with("STRmod", "-0").with("ST Wisdom", "-0"));
    expect(unknownNames(character)).toEqual(["Initiative", "STR modifier", "WIS save"]);
  });

  it("has a plus sign refused where the sheet prints a plain number", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "+18").with("PP", "+1")))).toEqual(["AC"]);
  });

  it.each(SHEET_NUMBERS.filter(isPlainNumber))("has only $name not known when $field holds a plus sign before the number", ({ field, name, value }) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with(field, `+${value}`)))).toEqual([name]);
  });

  it("has a very long digit string not known, not infinity", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "9".repeat(8000))))).toEqual(["AC"]);
  });

  it("has a very long text in a number field not known", () => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("AC", "x".repeat(8000))))).toEqual(["AC"]);
  });

  it.each(["35 ft. (walking", "35 ft. walking)"])("has the speed not known when it reads %j, with an unbalanced bracket", (printed) => {
    expect(unknownNames(readOf(MadeUpSheet.monk().with("Speed", printed)))).toEqual(["Speed"]);
  });
});
