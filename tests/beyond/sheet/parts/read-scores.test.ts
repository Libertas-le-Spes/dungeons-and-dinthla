import { describe, expect, it } from "vitest";
import { scoresOf } from "../../../../src/beyond/sheet/parts/read-scores";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_SCORES } from "../../builders/sheet-others";

const SCORES = Object.entries(SHEET_SCORES);

function scoresWithout(field: string) {
  return scoresOf(new SheetFields(MadeUpSheet.monk().without(field).fields()));
}

describe("the ability scores of a sheet", () => {
  it.each(SCORES)("keep the printed %s", (ability, printed) => {
    const scores = scoresOf(new SheetFields(MadeUpSheet.monk().fields()));
    expect(Reflect.get(scores, ability).valueOr(0)).toBe(printed.value);
  });

  it.each(SCORES)("leave only the %s not known when its field is missing", (ability, printed) => {
    const scores = scoresWithout(printed.field);
    const known = Object.entries(scores).filter(isKnown).map(nameOf);
    expect(known).toEqual(Object.keys(SHEET_SCORES).filter((other) => other !== ability));
  });

  it("are on the PDF route", () => {
    expect(scoresOf(new SheetFields(MadeUpSheet.monk().fields())).wisdom.route.name).toBe("pdf");
  });
});

function isKnown(entry: [string, { isKnown: boolean }]): boolean {
  return entry[1].isKnown;
}

function nameOf(entry: [string, unknown]): string {
  return entry[0];
}
