import type { ImportedNumber } from "../../shape/imported-number";
import { CARRYING_CAPACITY } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { CARRYING_CAPACITY_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { CARRYING_CAPACITY_TOUCHING } from "../core/touching-lists";
import { knownIn } from "../core/worked";
import { STRENGTH } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";

export class CarryingCapacityRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: CARRYING_CAPACITY_NAME, value: this.capacity(character, earlier) }];
  }

  private capacity(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const touching = CARRYING_CAPACITY_TOUCHING.unknownFor(character);
    if (touching !== null) return touching;
    const needed = NeededNumbers.of([STRENGTH.short], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const strength = needed.numberOf(STRENGTH.short);
    return knownIn(15 * strength, CARRYING_CAPACITY, `15 x STR ${strength} = ${15 * strength}`, character.route);
  }
}
