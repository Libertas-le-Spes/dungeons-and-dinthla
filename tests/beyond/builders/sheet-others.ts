export interface SheetNumberKept {
  readonly field: string;
  readonly printed: string;
  readonly value: number;
}

export const SHEET_SCORES: Record<string, SheetNumberKept> = {
  strength: { field: "STR", printed: "11", value: 11 },
  dexterity: { field: "DEX", printed: "12", value: 12 },
  constitution: { field: "CON", printed: "13", value: 13 },
  intelligence: { field: "INT", printed: "14", value: 14 },
  wisdom: { field: "WIS", printed: "15", value: 15 },
  charisma: { field: "CHA", printed: "16", value: 16 },
};

export const SHEET_PURSE: Record<string, SheetNumberKept> = {
  platinum: { field: "PP", printed: "61", value: 61 },
  gold: { field: "GP", printed: "62", value: 62 },
  electrum: { field: "EP", printed: "63", value: 63 },
  silver: { field: "SP", printed: "64", value: 64 },
  copper: { field: "CP", printed: "65", value: 65 },
};

export const ITEM_ROW_COUNT = 26;
