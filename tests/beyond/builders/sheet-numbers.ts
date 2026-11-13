export interface SheetNumber {
  readonly field: string;
  readonly printed: string;
  readonly name: string;
  readonly value: number;
  readonly lowest: number;
  readonly highest: number;
  readonly print: (value: number) => string;
}

function printedWhole(value: number): string {
  return String(value);
}

function printedSigned(value: number): string {
  if (value < 0) return String(value);
  return `+${value}`;
}

function printedFeet(value: number): string {
  return `${value} ft. (walking)`;
}

export const SHEET_NUMBERS: readonly SheetNumber[] = [
  { field: "AC", printed: "18", name: "AC", value: 18, lowest: 0, highest: 40, print: printedWhole },
  { field: "MaxHP", printed: "51", name: "HP", value: 51, lowest: 1, highest: 9999, print: printedWhole },
  { field: "CurrentHP", printed: "49", name: "Current HP", value: 49, lowest: 0, highest: 9999, print: printedWhole },
  { field: "TempHP", printed: "7", name: "Temporary HP", value: 7, lowest: 0, highest: 9999, print: printedWhole },
  { field: "Init", printed: "+9", name: "Initiative", value: 9, lowest: -20, highest: 50, print: printedSigned },
  { field: "Speed", printed: "35 ft. (walking)", name: "Speed", value: 35, lowest: 0, highest: 500, print: printedFeet },
  { field: "ProfBonus", printed: "+3", name: "Proficiency bonus", value: 3, lowest: 2, highest: 11, print: printedSigned },
  { field: "STRmod", printed: "+1", name: "STR modifier", value: 1, lowest: -5, highest: 10, print: printedSigned },
  { field: "DEXmod ", printed: "-2", name: "DEX modifier", value: -2, lowest: -5, highest: 10, print: printedSigned },
  { field: "CONmod", printed: "+3", name: "CON modifier", value: 3, lowest: -5, highest: 10, print: printedSigned },
  { field: "INTmod", printed: "+4", name: "INT modifier", value: 4, lowest: -5, highest: 10, print: printedSigned },
  { field: "WISmod", printed: "+5", name: "WIS modifier", value: 5, lowest: -5, highest: 10, print: printedSigned },
  { field: "CHamod", printed: "+6", name: "CHA modifier", value: 6, lowest: -5, highest: 10, print: printedSigned },
  { field: "ST Strength", printed: "+11", name: "STR save", value: 11, lowest: -20, highest: 50, print: printedSigned },
  { field: "ST Dexterity", printed: "+12", name: "DEX save", value: 12, lowest: -20, highest: 50, print: printedSigned },
  { field: "ST Constitution", printed: "-4", name: "CON save", value: -4, lowest: -20, highest: 50, print: printedSigned },
  { field: "ST Intelligence", printed: "+14", name: "INT save", value: 14, lowest: -20, highest: 50, print: printedSigned },
  { field: "ST Wisdom", printed: "+15", name: "WIS save", value: 15, lowest: -20, highest: 50, print: printedSigned },
  { field: "ST Charisma", printed: "+16", name: "CHA save", value: 16, lowest: -20, highest: 50, print: printedSigned },
  { field: "Acrobatics", printed: "+21", name: "Acrobatics", value: 21, lowest: -20, highest: 60, print: printedSigned },
  { field: "Animal", printed: "+22", name: "Animal Handling", value: 22, lowest: -20, highest: 60, print: printedSigned },
  { field: "Arcana", printed: "+23", name: "Arcana", value: 23, lowest: -20, highest: 60, print: printedSigned },
  { field: "Athletics", printed: "+24", name: "Athletics", value: 24, lowest: -20, highest: 60, print: printedSigned },
  { field: "Deception", printed: "+25", name: "Deception", value: 25, lowest: -20, highest: 60, print: printedSigned },
  { field: "History", printed: "+26", name: "History", value: 26, lowest: -20, highest: 60, print: printedSigned },
  { field: "Insight", printed: "+27", name: "Insight", value: 27, lowest: -20, highest: 60, print: printedSigned },
  { field: "Intimidation", printed: "+28", name: "Intimidation", value: 28, lowest: -20, highest: 60, print: printedSigned },
  { field: "Investigation", printed: "+29", name: "Investigation", value: 29, lowest: -20, highest: 60, print: printedSigned },
  { field: "Medicine", printed: "+30", name: "Medicine", value: 30, lowest: -20, highest: 60, print: printedSigned },
  { field: "Nature", printed: "+31", name: "Nature", value: 31, lowest: -20, highest: 60, print: printedSigned },
  { field: "Perception", printed: "+32", name: "Perception", value: 32, lowest: -20, highest: 60, print: printedSigned },
  { field: "Performance", printed: "+33", name: "Performance", value: 33, lowest: -20, highest: 60, print: printedSigned },
  { field: "Persuasion", printed: "+34", name: "Persuasion", value: 34, lowest: -20, highest: 60, print: printedSigned },
  { field: "Religion", printed: "+35", name: "Religion", value: 35, lowest: -20, highest: 60, print: printedSigned },
  { field: "SleightofHand", printed: "+36", name: "Sleight of Hand", value: 36, lowest: -20, highest: 60, print: printedSigned },
  { field: "Stealth ", printed: "+37", name: "Stealth", value: 37, lowest: -20, highest: 60, print: printedSigned },
  { field: "Survival", printed: "+38", name: "Survival", value: 38, lowest: -20, highest: 60, print: printedSigned },
  { field: "Passive1", printed: "41", name: "Passive Perception", value: 41, lowest: 0, highest: 80, print: printedWhole },
  { field: "Passive2", printed: "42", name: "Passive Insight", value: 42, lowest: 0, highest: 80, print: printedWhole },
  { field: "Passive3", printed: "43", name: "Passive Investigation", value: 43, lowest: 0, highest: 80, print: printedWhole },
  { field: "spellSaveDC0", printed: "19", name: "Monk spell save DC", value: 19, lowest: 0, highest: 60, print: printedWhole },
  { field: "spellAtkBonus0", printed: "+8", name: "Monk spell attack bonus", value: 8, lowest: -20, highest: 50, print: printedSigned },
];
