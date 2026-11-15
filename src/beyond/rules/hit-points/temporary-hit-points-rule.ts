import type { ImportedNumber } from "../../shape/imported-number";
import { TEMPORARY_HIT_POINTS } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import { TEMPORARY_HIT_POINTS_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { knownIn, notKnown } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";

export class TemporaryHitPointsRule implements Rule {
  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: TEMPORARY_HIT_POINTS_NAME, value: this.temporary(character) }];
  }

  private temporary(character: RuleCharacter): WorkedValue<number> {
    if (character.temporaryHitPoints === null) return notKnown("The temporary hit points are missing.", character.route);
    return knownIn(character.temporaryHitPoints, TEMPORARY_HIT_POINTS, "", character.route);
  }
}
