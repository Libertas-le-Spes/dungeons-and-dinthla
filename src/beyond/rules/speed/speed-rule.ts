import type { ImportedNumber } from "../../shape/imported-number";
import { SPEED } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { SPEED_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { SPEED_TOUCHING } from "../core/touching-lists";
import { knownIn, notKnown } from "../core/worked";
import { sumWorking } from "../core/working-text";
import { STRENGTH } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredSubTypes } from "../modifiers/handlers/ignored-sub-types";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyFor } from "../modifiers/tally-for";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { armourTooHeavy } from "./armour-too-heavy";

const FAMILY = new SubTypeFamily([], ["speed", "movement"]);
const OTHER_MOVEMENT = new IgnoredSubTypes(["innate-speed-flying", "innate-speed-swimming", "innate-speed-climbing", "innate-speed-burrowing"]);

export class SpeedRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: SPEED_NAME, value: this.speed(character, earlier) }];
  }

  private speed(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const touching = SPEED_TOUCHING.unknownFor(character);
    if (touching !== null) return touching;
    if (character.walkingSpeed === null) return notKnown("The walking speed is missing.", character.route);
    const needed = NeededNumbers.of([STRENGTH.short], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const heavy = armourTooHeavy(character, needed.numberOf(STRENGTH.short));
    if (heavy !== null) return heavy;
    return this.withModifiers(character, character.walkingSpeed);
  }

  private withModifiers(character: RuleCharacter, base: number): WorkedValue<number> {
    const tally = tallyFor(character, FAMILY, ["speed"], [OTHER_MOVEMENT]);
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const total = base + tally.added;
    return knownIn(total, SPEED, sumWorking([`walking ${base}`, ...tally.applied], total), character.route);
  }
}
