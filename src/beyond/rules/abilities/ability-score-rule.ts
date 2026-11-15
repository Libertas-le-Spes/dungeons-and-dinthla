import type { ImportedNumber } from "../../shape/imported-number";
import { SCORE, SCORE_MODIFIER_VALUE } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { Rule } from "../core/rule";
import { knownIn, notKnown } from "../core/worked";
import { sumWorking } from "../core/working-text";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { SetFloor } from "../modifiers/handlers/set-floor";
import type { ModifierTally, FloorNote } from "../modifiers/modifier-tally";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyFor } from "../modifiers/tally-for";
import { unknownModifiers } from "../modifiers/unknown-modifiers";

const USUAL_MOST = 20;

function byValueDescending(first: FloorNote, second: FloorNote): number {
  return second.value - first.value;
}

function highestFloorOf(tally: ModifierTally): FloorNote | undefined {
  return [...tally.floors].sort(byValueDescending).find(() => true);
}

export class AbilityScoreRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: this.ability.short, value: this.score(character) }];
  }

  private score(character: RuleCharacter): WorkedValue<number> {
    const override = character.scoreOverrides.get(this.ability);
    if (override !== undefined) return knownIn(override, SCORE, "Set by hand", character.route);
    return this.fromBase(character);
  }

  private fromBase(character: RuleCharacter): WorkedValue<number> {
    const base = character.baseScores.get(this.ability);
    const bonus = character.bonusScores.get(this.ability);
    if (base === undefined) return this.missing(character);
    if (bonus === undefined) return this.missing(character);
    return this.withModifiers(character, base, bonus);
  }

  private missing(character: RuleCharacter): WorkedValue<number> {
    return notKnown(`${this.ability.label} is missing a base score or its bonus.`, character.route);
  }

  private withModifiers(character: RuleCharacter, base: number, bonus: number): WorkedValue<number> {
    const own = `${this.ability.subTypeName}-score`;
    const tally = tallyFor(character, new SubTypeFamily([], [own]), [own], [new SetFloor(own, SCORE)], SCORE_MODIFIER_VALUE);
    const unknown = unknownModifiers(tally, character.route);
    if (unknown !== null) return unknown;
    const summed = base + bonus + tally.added;
    const floor = highestFloorOf(tally);
    const working = sumWorking([`base ${base}`, `bonus ${bonus}`, ...tally.applied], summed);
    if (floor !== undefined && floor.value > summed) return knownIn(floor.value, SCORE, `${working}, set to ${floor.value} by ${floor.source}`, character.route);
    if (summed > USUAL_MOST) return notKnown(`Score above ${USUAL_MOST}.`, character.route);
    if (floor === undefined) return knownIn(summed, SCORE, working, character.route);
    return knownIn(summed, SCORE, `${working}, set to ${floor.value} by ${floor.source} has no effect`, character.route);
  }
}
