import type { ImportedNumber } from "../../shape/imported-number";
import { CARRYING_CAPACITY } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { hasFeature } from "../core/has-feature";
import { NeededNumbers } from "../core/needed-numbers";
import { CARRYING_CAPACITY_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { sameName } from "../core/same-name";
import { knownIn, notKnown } from "../core/worked";
import { STRENGTH } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { CARRYING_SIZES } from "./carrying-size";
import type { CarryingSize } from "./carrying-size";

const POWERFUL_BUILD = "Powerful Build";

function countedSizeOf(character: RuleCharacter): CarryingSize | undefined {
  const index = CARRYING_SIZES.findIndex((size) => sameName(size.name, character.size));
  if (index < 0) return undefined;
  if (!hasFeature(character, POWERFUL_BUILD)) return CARRYING_SIZES.find((_, at) => at === index);
  const larger = Math.min(index + 1, CARRYING_SIZES.length - 1);
  return CARRYING_SIZES.find((_, at) => at === larger);
}

function workingOf(strength: number, size: CarryingSize, total: number): string {
  if (size.multiplier === 1) return `15 x STR ${strength} = ${total}`;
  return `15 x STR ${strength} x ${size.multiplier} for a ${size.name} load = ${total}`;
}

export class CarryingCapacityRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: CARRYING_CAPACITY_NAME, value: this.capacity(character, earlier) }];
  }

  private capacity(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const size = countedSizeOf(character);
    if (size === undefined) return notKnown("The size is not known, and the carrying capacity depends on it.", character.route);
    const needed = NeededNumbers.of([STRENGTH.short], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const strength = needed.numberOf(STRENGTH.short);
    const total = 15 * strength * size.multiplier;
    if (!Number.isInteger(total)) return notKnown(`15 x STR ${strength} x ${size.multiplier} is not a whole number.`, character.route);
    return knownIn(total, CARRYING_CAPACITY, workingOf(strength, size, total), character.route);
  }
}
