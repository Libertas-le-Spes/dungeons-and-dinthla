import { describe, expect, it } from "vitest";
import { castingNumbersOf } from "../../../../src/beyond/sheet/parts/read-casting";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { nameOf } from "../../builders/sheet-reading";

function castingOf(sheet: MadeUpSheet) {
  return castingNumbersOf(new SheetFields(sheet.fields()));
}

function castingSheet(label: string | boolean | string[]): MadeUpSheet {
  return MadeUpSheet.empty().with("spellCastingClass0", label).with("spellSaveDC0", "13").with("spellAtkBonus0", "+5");
}

function valueOf(number: { value: { valueOr(whenNotKnown: number): number } }): number {
  return number.value.valueOr(Number.NaN);
}

function isKnown(number: { value: { isKnown: boolean } }): boolean {
  return number.value.isKnown;
}

describe("the spellcasting numbers of a sheet", () => {
  it("are named from the first casting class, the way the rules name them", () => {
    expect(castingOf(castingSheet("Primary Wizard")).map(nameOf)).toEqual(["Primary Wizard spell save DC", "Primary Wizard spell attack bonus"]);
  });

  it("keep the printed save DC and attack bonus", () => {
    expect(castingOf(castingSheet("Wizard")).map(valueOf)).toEqual([13, 5]);
  });

  it.each([true, ["Wizard"], "", "   ", "<br>", "⠀", "two\nlines", "x".repeat(101)])("fall back to the generic names when the class holds %j", (label) => {
    expect(castingOf(castingSheet(label)).map(nameOf)).toEqual(["Spell save DC", "Spell attack bonus"]);
  });

  it("fall back to the generic names when the class field is missing, and keep the numbers", () => {
    const found = castingOf(MadeUpSheet.empty().with("spellSaveDC0", "13").with("spellAtkBonus0", "+5"));
    expect([found.map(nameOf), found.map(valueOf)]).toEqual([["Spell save DC", "Spell attack bonus"], [13, 5]]);
  });

  it("have the numbers not known, still named, when their fields are missing", () => {
    expect(castingOf(MadeUpSheet.empty().with("spellCastingClass0", "Wizard")).map(isKnown)).toEqual([false, false]);
  });
});
