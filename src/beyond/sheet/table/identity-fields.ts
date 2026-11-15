import { PrintedLine } from "../lines/printed-line";
import { noCharacterName, noSpecies } from "../refusals/sheet-refusals";

export const CHARACTER_NAME = "CharacterName";
export const CLASS_AND_LEVEL = "CLASS  LEVEL";
export const SPECIES = "RACE";
export const SIZE = "SIZE";
export const ALIGNMENT = "ALIGNMENT";

export const NAME_LINE = new PrintedLine(CHARACTER_NAME, noCharacterName);
export const SPECIES_LINE = new PrintedLine(SPECIES, noSpecies);
