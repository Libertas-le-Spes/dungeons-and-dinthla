import { describe, expect, it } from "vitest";
import type { AbilityScores } from "../../../../src/beyond/shape/ability-scores";
import { scoresOf } from "../../../../src/beyond/sheet/parts/read-scores";
import { SheetFields } from "../../../../src/beyond/sheet/sheet-fields";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { SHEET_SCORES } from "../../builders/sheet-others";
import type { SheetScore } from "../../builders/sheet-others";

function scoresOfSheet(sheet: MadeUpSheet): AbilityScores {
  return scoresOf(new SheetFields(sheet.fields()));
}

function knownAbilities(scores: AbilityScores): string[] {
  return SHEET_SCORES.filter(isKnownIn(scores)).map(abilityOf);
}

function isKnownIn(scores: AbilityScores): (score: SheetScore) => boolean {
  return function isKnown(score: SheetScore): boolean {
    return scores[score.ability].isKnown;
  };
}

function abilityOf(score: SheetScore): string {
  return score.ability;
}

function otherAbilities(not: string): string[] {
  return SHEET_SCORES.map(abilityOf).filter(differsFrom(not));
}

function differsFrom(not: string): (ability: string) => boolean {
  return function differs(ability: string): boolean {
    return ability !== not;
  };
}

function knownWhen(ability: keyof AbilityScores, field: string): (text: string) => boolean {
  return function known(text: string): boolean {
    return scoresOfSheet(MadeUpSheet.monk().with(field, text))[ability].isKnown;
  };
}

describe("the ability scores of a sheet", () => {
  it.each(SHEET_SCORES)("keep the printed $ability", ({ ability, value }) => {
    expect(scoresOfSheet(MadeUpSheet.monk())[ability].valueOr(0)).toBe(value);
  });

  it.each(SHEET_SCORES)("leave only the $ability not known when $field is missing", ({ ability, field }) => {
    expect(knownAbilities(scoresOfSheet(MadeUpSheet.monk().without(field)))).toEqual(otherAbilities(ability));
  });

  it.each(SHEET_SCORES)("keep the $ability at 1 and at 30, and refuse 0 and 31", ({ ability, field }) => {
    const known = knownWhen(ability, field);
    expect([known("0"), known("1"), known("30"), known("31")]).toEqual([false, true, true, false]);
  });

  it("are on the PDF route", () => {
    expect(scoresOfSheet(MadeUpSheet.monk()).wisdom.route.name).toBe("pdf");
  });
});
