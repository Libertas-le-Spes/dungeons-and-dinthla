import type { ImportedNumber } from "../../shape/imported-number";
import { PROFICIENCY_BONUS } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { PROFICIENCY_BONUS_NAME, TOTAL_LEVEL_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { knownIn } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";

export class ProficiencyBonusRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: PROFICIENCY_BONUS_NAME, value: this.bonus(character, earlier) }];
  }

  private bonus(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const needed = NeededNumbers.of([TOTAL_LEVEL_NAME], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const level = needed.numberOf(TOTAL_LEVEL_NAME);
    const bonus = 2 + Math.floor((level - 1) / 4);
    return knownIn(bonus, PROFICIENCY_BONUS, `2 + floor((${level} - 1) / 4) = ${bonus}`, character.route);
  }
}
