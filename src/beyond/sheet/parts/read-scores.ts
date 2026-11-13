import type { AbilityScores } from "../../shape/ability-scores";
import type { SheetFields } from "../sheet-fields";
import { SCORE_FIELDS } from "../table/numbers/score-rows";

export function scoresOf(fields: SheetFields): AbilityScores {
  return {
    strength: SCORE_FIELDS.strength.read(fields),
    dexterity: SCORE_FIELDS.dexterity.read(fields),
    constitution: SCORE_FIELDS.constitution.read(fields),
    intelligence: SCORE_FIELDS.intelligence.read(fields),
    wisdom: SCORE_FIELDS.wisdom.read(fields),
    charisma: SCORE_FIELDS.charisma.read(fields),
  };
}
