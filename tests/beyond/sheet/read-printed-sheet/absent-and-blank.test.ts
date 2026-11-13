import { describe, expect, it } from "vitest";
import { readPrintedSheet } from "../../../../src/beyond/sheet/read-printed-sheet";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_NUMBERS } from "../../builders/sheet-numbers";
import { isNamed, readOf, unknownNames } from "../../builders/sheet-reading";
import type { FieldValue } from "../../../../src/pdf/fields/field-value";

const IDENTITY = ["CharacterName", "RACE", "CLASS  LEVEL", "spellCastingClass0"];

function withEveryFieldBut(kept: readonly string[], value: FieldValue): MadeUpSheet {
  const sheet = MadeUpSheet.monk();
  for (const name of sheet.names()) {
    if (!kept.includes(name)) sheet.with(name, value);
  }
  return sheet;
}

function countKnown(item: { count: { isKnown: boolean } }): boolean {
  return item.count.isKnown;
}

describe("reading a sheet with fields gone, blank or of the wrong kind", () => {
  it("is refused when there are no fields at all, as the sheet has no name", () => {
    expect(() => readPrintedSheet(new Map())).toThrow(Refusal);
  });

  it("has every number not known, and every list empty, when only who the character is is there", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, "").without("PP"));
    expect([unknownNames(character).length, character.inventory, character.spells, character.features]).toEqual([SHEET_NUMBERS.length, [], [], []]);
  });

  it("has every number and coin not known when each field is only spaces", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, "   "));
    expect([unknownNames(character).length, character.scores.strength.isKnown, character.purse.copper.isKnown, character.inventory.map(countKnown)]).toEqual([SHEET_NUMBERS.length, false, false, []]);
  });

  it("has every number, score and coin not known when each field holds a check box instead of text", () => {
    const character = readOf(withEveryFieldBut(IDENTITY, true));
    expect([unknownNames(character).length, character.scores.charisma.isKnown, character.purse.gold.isKnown, character.spells]).toEqual([SHEET_NUMBERS.length, false, false, []]);
  });

  it("has every number not known when each field holds a choice list instead of text", () => {
    expect(unknownNames(readOf(withEveryFieldBut(IDENTITY, ["Primary"]))).length).toBe(SHEET_NUMBERS.length);
  });

  it("has no number turned into zero or false when a field is absent or blank", () => {
    const character = readOf(MadeUpSheet.monk().without("AC").with("MaxHP", ""));
    expect([character.numbers.find(isNamed("AC"))?.value.valueOr(-1), character.numbers.find(isNamed("HP"))?.value.valueOr(-1)]).toEqual([-1, -1]);
  });
});
