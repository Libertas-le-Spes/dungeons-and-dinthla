import type { CharacterSheet, SheetValue } from "../../../src/characters/reading/character-sheet";

export function sheetValueNamed(sheet: CharacterSheet, name: string): SheetValue {
  for (const value of sheet.values) {
    if (value.name === name) return value;
  }
  throw new Error(`The sheet has no value called ${name}.`);
}
