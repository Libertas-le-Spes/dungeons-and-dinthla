import type { ImportedNumber } from "../../shape/imported-number";
import { CARRYING_CAPACITY } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import type { RuleCharacter } from "../input/rule-character";

const CHANGING_FEATURES = ["Powerful Build"];

function hasChangingFeature(character: RuleCharacter): boolean {
  return CHANGING_FEATURES.some((feature) => character.features.includes(feature));
}

export class CarryingCapacityRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Carrying capacity", value: this.capacity(character, earlier) }];
  }

  private capacity(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const missing = unknownAmong(["STR"], earlier, character.route);
    if (missing !== null) return missing;
    if (hasChangingFeature(character)) return new NotKnownValue("A feature such as Powerful Build changes the carrying capacity, and I don't work that out here.", character.route);
    const strength = earlier.valueOf("STR", character.route).valueOr(0);
    return numberInRange(15 * strength, CARRYING_CAPACITY, `15 x STR ${strength} = ${15 * strength}`, character.route);
  }
}
