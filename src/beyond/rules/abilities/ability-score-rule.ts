import type { ImportedNumber } from "../../shape/imported-number";
import { SCORE } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { Rule } from "../core/rule";
import { sumWorking } from "../core/working-text";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { standardHandlers } from "../modifiers/standard-handlers";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";

export class AbilityScoreRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: this.ability.short, value: this.score(character) }];
  }

  private score(character: RuleCharacter): WorkedValue<number> {
    const override = character.scoreOverrides.get(this.ability);
    if (override !== undefined) return numberInRange(override, SCORE, `${this.ability.label} set on D&D Beyond: ${override}`, character.route);
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
    return new NotKnownValue(`${this.ability.label} is missing a base score or its bonus.`, character.route);
  }

  private withModifiers(character: RuleCharacter, base: number, bonus: number): WorkedValue<number> {
    const family = new SubTypeFamily([`${this.ability.subTypeName}-score`], []);
    const tally = tallyModifiers(character.modifiers, family, standardHandlers([`${this.ability.subTypeName}-score`]));
    const unknown = unknownModifiers(tally, character.route);
    if (unknown !== null) return unknown;
    const terms = [`base ${base}`, `bonus ${bonus}`, ...tally.applied];
    return numberInRange(base + bonus + tally.added, SCORE, sumWorking(terms, base + bonus + tally.added), character.route);
  }
}
