import { describe, expect, it } from "vitest";
import { ABILITIES } from "../../../../src/beyond/rules/input/ability";
import { SKILLS } from "../../../../src/beyond/rules/proficiency/skills/skills";
import { numbersOf } from "../../../../src/beyond/sheet/parts/read-numbers";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { isNamed, isNotKnown, nameOf } from "../../builders/sheet-reading";
import { SHEET_NUMBERS } from "../../builders/sheet-numbers";

function numbersOfSheet(sheet: MadeUpSheet) {
  return numbersOf(new SheetFields(sheet.fields()));
}

describe("the numbers of a sheet", () => {
  it.each(SHEET_NUMBERS)("keep $name as printed in $field", ({ name, value }) => {
    const found = numbersOfSheet(MadeUpSheet.monk()).find(isNamed(name));
    expect([found?.value.isKnown, found?.value.valueOr(0), found?.value.route.name]).toEqual([true, value, "pdf"]);
  });

  it.each(SHEET_NUMBERS)("have only $name not known when $field is missing", ({ field, name }) => {
    const unknown = numbersOfSheet(MadeUpSheet.monk().without(field)).filter(isNotKnown);
    expect(unknown.map(nameOf)).toEqual([name]);
  });

  it("are as many as the table lists, each by a different name", () => {
    const names = numbersOfSheet(MadeUpSheet.monk()).map(nameOf);
    expect([names.length, new Set(names).size]).toEqual([SHEET_NUMBERS.length, SHEET_NUMBERS.length]);
  });

  it("use the names the rules use for the six modifiers, saves and eighteen skills", () => {
    const names = new Set(numbersOfSheet(MadeUpSheet.monk()).map(nameOf));
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
