import { describe, expect, it } from "vitest";
import { classesOf } from "../../../../src/beyond/sheet/classes/read-classes";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";

const CLASS_FIELD = "CLASS  LEVEL";
const NONE = "The sheet names no class for this character.";

function fieldsWith(held: string | boolean | string[]): SheetFields {
  return new SheetFields(MadeUpSheet.empty().with(CLASS_FIELD, held).fields());
}

function summaryOf(printed: string): string[] {
  return classesOf(fieldsWith(printed)).map(summaryOfOne);
}

function summaryOfOne(found: { name: { text: string }; level: { valueOr(whenNotKnown: number): number; isKnown: boolean } }): string {
  return `${found.name.text}:${found.level.isKnown}:${found.level.valueOr(0)}`;
}

describe("the classes of a sheet", () => {
  it("are the one class and its level", () => {
    expect(summaryOf("Monk 4")).toEqual(["Monk:true:4"]);
  });

  it("are several, split at a slash", () => {
    expect(summaryOf("Monk 3 / Wizard 1/Rogue 2")).toEqual(["Monk:true:3", "Wizard:true:1", "Rogue:true:2"]);
  });

  it("leave out a piece that holds nothing", () => {
    expect(summaryOf("Monk 3 / / Wizard 1 /")).toEqual(["Monk:true:3", "Wizard:true:1"]);
  });

  it("are all without a level when the levels pass the most there can be", () => {
    expect(summaryOf("Monk 20 / Wizard 20 / Rogue 1")).toEqual(["Monk:false:0", "Wizard:false:0", "Rogue:false:0"]);
  });

  it("are as many as twenty, and refused at twenty-one", () => {
    const twenty = Array.from({ length: 20 }, nameOfPiece).join(" / ");
    expect(summaryOf(twenty)).toHaveLength(20);
    expect(() => summaryOf(`${twenty} / Extra 1`)).toThrow("The list of classes is over the limit of 20 classes.");
  });

  it("are refused when the field is missing", () => {
    expect(() => classesOf(new SheetFields(new Map()))).toThrow(NONE);
  });

  it.each([true, ["Monk 4"], "", "   ", " / / ", "<br> 3"])("are refused for %j", (held) => {
    expect(() => classesOf(fieldsWith(held))).toThrow(Refusal);
  });

  it("are refused with the one reason when the field holds no class", () => {
    expect(() => classesOf(fieldsWith(""))).toThrow(NONE);
  });
});

function nameOfPiece(_unused: unknown, position: number): string {
  return `Class ${position} 1`;
}
