import type { AbilityScores } from "../../../src/beyond/shape/ability-scores";
import type { Purse } from "../../../src/beyond/shape/purse";

export interface SheetScore {
  readonly ability: keyof AbilityScores;
  readonly field: string;
  readonly printed: string;
  readonly value: number;
}

export interface SheetCoin {
  readonly coin: keyof Purse;
  readonly field: string;
  readonly printed: string;
  readonly value: number;
}

export const SHEET_SCORES: readonly SheetScore[] = [
  { ability: "strength", field: "STR", printed: "11", value: 11 },
  { ability: "dexterity", field: "DEX", printed: "12", value: 12 },
  { ability: "constitution", field: "CON", printed: "13", value: 13 },
  { ability: "intelligence", field: "INT", printed: "14", value: 14 },
  { ability: "wisdom", field: "WIS", printed: "15", value: 15 },
  { ability: "charisma", field: "CHA", printed: "16", value: 16 },
];

export const SHEET_PURSE: readonly SheetCoin[] = [
  { coin: "platinum", field: "PP", printed: "61", value: 61 },
  { coin: "gold", field: "GP", printed: "62", value: 62 },
  { coin: "electrum", field: "EP", printed: "63", value: 63 },
  { coin: "silver", field: "SP", printed: "64", value: 64 },
  { coin: "copper", field: "CP", printed: "65", value: 65 },
];

export const ITEM_ROW_COUNT = 26;
