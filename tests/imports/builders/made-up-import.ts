import type { ImportedCharacter } from "../../../src/beyond/shape/imported-character";
import { NotKnownValue } from "../../../src/beyond/shape/not-known-value";
import type { PrintedSheet } from "../../../src/beyond/sheet/printed-sheet";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { printedOf } from "../../beyond/builders/sheet-reading";
import { PRINTED } from "../../../src/beyond/sheet/printed-route";
import type { ImportStamp } from "../../../src/imports/note/properties/import-stamp";

export const TODAY = "2026-11-13";

export function stampedOn(today: string): ImportStamp {
  return { today, session: 0 };
}

export function monkSheet(): PrintedSheet {
  return printedOf(MadeUpSheet.monk());
}

export function sheetOf(made: MadeUpSheet): PrintedSheet {
  return printedOf(made);
}

export function sheetWithCharacter(sheet: PrintedSheet, change: Partial<ImportedCharacter>): PrintedSheet {
  return { ...sheet, character: { ...sheet.character, ...change } };
}

export function notKnownNumber(): NotKnownValue<number> {
  return new NotKnownValue("A reason.", PRINTED);
}

export function noLoss() {
  return { tooLong: 0, notClean: 0 };
}
