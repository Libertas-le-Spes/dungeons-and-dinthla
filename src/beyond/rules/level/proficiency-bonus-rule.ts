import type { ImportedNumber } from "../../shape/imported-number";
import { PROFICIENCY_BONUS } from "../../shape/import-limits";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import type { RuleCharacter } from "../input/rule-character";

export class ProficiencyBonusRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Proficiency bonus", value: this.bonus(character, earlier) }];
  }

  private bonus(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const missing = unknownAmong(["Total level"], earlier, character.route);
    if (missing !== null) return missing;
    const level = earlier.valueOf("Total level", character.route).valueOr(0);
    const bonus = 2 + Math.floor((level - 1) / 4);
    return numberInRange(bonus, PROFICIENCY_BONUS, `2 + floor((${level} - 1) / 4) = ${bonus}`, character.route);
  }
}
