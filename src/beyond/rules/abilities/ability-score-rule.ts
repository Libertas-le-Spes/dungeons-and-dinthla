import type { ImportedNumber } from "../../shape/imported-number";
import { SCORE } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { Rule } from "../core/rule";
import { knownIn, notKnown } from "../core/worked";
import { sumWorking } from "../core/working-text";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyFor } from "../modifiers/tally-for";
import { unknownModifiers } from "../modifiers/unknown-modifiers";

export class AbilityScoreRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: this.ability.short, value: this.score(character) }];
  }

  private score(character: RuleCharacter): WorkedValue<number> {
    const override = character.scoreOverrides.get(this.ability);
    if (override !== undefined) return knownIn(override, SCORE, `${this.ability.label} set on D&D Beyond: ${override}`, character.route);
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
    const tally = tallyFor(character, new SubTypeFamily([], [own]), [own]);
    const unknown = unknownModifiers(tally, character.route);
    if (unknown !== null) return unknown;
    const total = base + bonus + tally.added;
    return knownIn(total, SCORE, sumWorking([`base ${base}`, `bonus ${bonus}`, ...tally.applied], total), character.route);
  }
}
