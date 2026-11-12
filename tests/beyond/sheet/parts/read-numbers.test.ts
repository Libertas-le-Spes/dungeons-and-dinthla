import { describe, expect, it } from "vitest";
import { numbersOf } from "../../../../src/beyond/sheet/parts/read-numbers";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { SKILLS } from "../../../../src/beyond/rules/proficiency/skills/skills";
import { ABILITIES } from "../../../../src/beyond/rules/input/ability";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_NUMBERS } from "../../builders/sheet-numbers";

function numbersOfSheet(sheet: MadeUpSheet) {
  return numbersOf(new SheetFields(sheet.fields()));
}

function namesOf(numbers: readonly { name: string }[]): string[] {
  return numbers.map(nameOfNumber);
}

function nameOfNumber(number: { name: string }): string {
  return number.name;
}

describe("the numbers of a sheet", () => {
  it.each(SHEET_NUMBERS)("keep $name as printed in $field", ({ name, value }) => {
    const found = numbersOfSheet(MadeUpSheet.monk()).find(isNamed(name));
    expect([found?.value.isKnown, found?.value.valueOr(0), found?.value.route.name]).toEqual([true, value, "pdf"]);
  });

  it.each(SHEET_NUMBERS)("have only $name not known when $field is missing", ({ field, name }) => {
    const unknown = numbersOfSheet(MadeUpSheet.monk().without(field)).filter(isNotKnown);
    expect(namesOf(unknown)).toEqual([name]);
  });

  it("are as many as the table lists, each by a different name", () => {
    const names = namesOf(numbersOfSheet(MadeUpSheet.monk()));
    expect([names.length, new Set(names).size]).toEqual([SHEET_NUMBERS.length, SHEET_NUMBERS.length]);
  });

  it("use the names the rules use for the six modifiers, saves and eighteen skills", () => {
    const names = new Set(namesOf(numbersOfSheet(MadeUpSheet.monk())));
    for (const ability of ABILITIES) {
      expect(names.has(ability.modifierName)).toBe(true);
      expect(names.has(ability.saveName)).toBe(true);
    }
    for (const skill of SKILLS) expect(names.has(skill.name)).toBe(true);
  });

  it("have every number not known on a sheet with no fields", () => {
    expect(numbersOfSheet(MadeUpSheet.empty()).filter(isNotKnown)).toHaveLength(SHEET_NUMBERS.length);
  });
});

function isNamed(name: string): (number: { name: string }) => boolean {
  return function named(number: { name: string }): boolean {
    return number.name === name;
  };
}

function isNotKnown(number: { value: { isKnown: boolean } }): boolean {
  return !number.value.isKnown;
}
