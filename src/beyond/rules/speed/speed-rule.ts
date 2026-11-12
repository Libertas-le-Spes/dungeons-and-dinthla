import type { ImportedNumber } from "../../shape/imported-number";
import { SPEED } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import { sumWorking } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import { standardHandlers } from "../modifiers/standard-handlers";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { armourTooHeavy } from "./armour-too-heavy";

const FAMILY = new SubTypeFamily(["speed", "unarmored-movement"], []);

export class SpeedRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Speed", value: this.speed(character, earlier) }];
  }

  private speed(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    if (character.walkingSpeed === null) return new NotKnownValue("The walking speed is missing.", character.route);
    const missing = unknownAmong(["STR"], earlier, character.route);
    if (missing !== null) return missing;
    const heavy = armourTooHeavy(character, earlier.valueOf("STR", character.route).valueOr(0));
    if (heavy !== null) return heavy;
    return this.withModifiers(character, character.walkingSpeed);
  }

  private withModifiers(character: RuleCharacter, base: number): WorkedValue<number> {
    const tally = tallyModifiers(character.modifiers, FAMILY, standardHandlers(["speed"]));
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const total = base + tally.added;
    return numberInRange(total, SPEED, sumWorking([`walking ${base}`, ...tally.applied], total), character.route);
  }
}
