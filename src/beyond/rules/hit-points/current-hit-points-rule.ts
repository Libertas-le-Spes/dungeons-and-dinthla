import type { ImportedNumber } from "../../shape/imported-number";
import { HIT_POINTS } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { CURRENT_HIT_POINTS_NAME, MAX_HIT_POINTS_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { knownIn, notKnown } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";

export class CurrentHitPointsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: CURRENT_HIT_POINTS_NAME, value: this.current(character, earlier) }];
  }

  private current(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const needed = NeededNumbers.of([MAX_HIT_POINTS_NAME], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    if (character.removedHitPoints === null) return notKnown("The hit points lost are missing.", character.route);
    const maximum = needed.numberOf(MAX_HIT_POINTS_NAME);
    const current = maximum - character.removedHitPoints;
    return knownIn(current, HIT_POINTS, `${maximum} - ${character.removedHitPoints} lost = ${current}`, character.route);
  }
}
