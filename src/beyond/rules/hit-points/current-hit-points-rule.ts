import type { ImportedNumber } from "../../shape/imported-number";
import { HIT_POINTS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import type { RuleCharacter } from "../input/rule-character";

export class CurrentHitPointsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Current HP", value: this.current(character, earlier) }];
  }

  private current(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const missing = unknownAmong(["HP"], earlier, character.route);
    if (missing !== null) return missing;
    if (character.removedHitPoints === null) return new NotKnownValue("The hit points lost are missing.", character.route);
    const maximum = earlier.valueOf("HP", character.route).valueOr(0);
    const current = maximum - character.removedHitPoints;
    return numberInRange(current, HIT_POINTS, `${maximum} - ${character.removedHitPoints} lost = ${current}`, character.route);
  }
}
