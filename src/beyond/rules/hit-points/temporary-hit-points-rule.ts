import type { ImportedNumber } from "../../shape/imported-number";
import { TEMPORARY_HIT_POINTS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { Rule } from "../core/rule";
import type { RuleCharacter } from "../input/rule-character";

export class TemporaryHitPointsRule implements Rule {
  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: "Temporary HP", value: this.temporary(character) }];
  }

  private temporary(character: RuleCharacter): WorkedValue<number> {
    if (character.temporaryHitPoints === null) return new NotKnownValue("The temporary hit points are missing.", character.route);
    return numberInRange(character.temporaryHitPoints, TEMPORARY_HIT_POINTS, `Temporary hit points on D&D Beyond: ${character.temporaryHitPoints}`, character.route);
  }
}
