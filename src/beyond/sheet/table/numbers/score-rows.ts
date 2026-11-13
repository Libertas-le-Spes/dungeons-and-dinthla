import type { AbilityScores } from "../../../shape/ability-scores";
import { SCORE } from "../../../shape/import-limits";
import { WHOLE } from "../../numbers/number-texts";
import { PrintedNumber } from "../../numbers/printed-number";

export const SCORE_FIELDS: Record<keyof AbilityScores, PrintedNumber> = {
  strength: new PrintedNumber("STR", SCORE, WHOLE),
  dexterity: new PrintedNumber("DEX", SCORE, WHOLE),
  constitution: new PrintedNumber("CON", SCORE, WHOLE),
  intelligence: new PrintedNumber("INT", SCORE, WHOLE),
  wisdom: new PrintedNumber("WIS", SCORE, WHOLE),
  charisma: new PrintedNumber("CHA", SCORE, WHOLE),
};
