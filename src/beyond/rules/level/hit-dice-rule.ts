import type { ImportedNumber } from "../../shape/imported-number";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { isHitDie } from "../classes/hit-die";
import { NeededNumbers } from "../core/needed-numbers";
import { HIT_DICE_NAME, TOTAL_LEVEL_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { knownNumber, notKnown } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

function diceTerm(ruleClass: RuleClass): string {
  return `${ruleClass.name.text} ${ruleClass.level}d${ruleClass.hitDie}`;
}

export class HitDiceRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: HIT_DICE_NAME, value: this.dice(character, earlier) }];
  }

  private dice(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const needed = NeededNumbers.of([TOTAL_LEVEL_NAME], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    if (!character.classes.every(isHitDie)) return notKnown("A hit die has to be a d4, d6, d8, d10 or d12.", character.route);
    return knownNumber(needed.numberOf(TOTAL_LEVEL_NAME), character.classes.map(diceTerm).join(" + "), character.route);
  }
}
