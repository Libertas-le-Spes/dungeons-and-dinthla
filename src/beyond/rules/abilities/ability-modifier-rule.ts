import type { ImportedNumber } from "../../shape/imported-number";
import { ABILITY_MODIFIER } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import { NeededNumbers } from "../core/needed-numbers";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { knownIn } from "../core/worked";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { modifierOf } from "./modifier-of";

export class AbilityModifierRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: this.ability.modifierName, value: this.modifier(character, earlier) }];
  }

  private modifier(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const needed = NeededNumbers.of([this.ability.short], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const score = needed.numberOf(this.ability.short);
    const modifier = modifierOf(score);
    return knownIn(modifier, ABILITY_MODIFIER, `floor((${score} - 10) / 2) = ${modifier}`, character.route);
  }
}
