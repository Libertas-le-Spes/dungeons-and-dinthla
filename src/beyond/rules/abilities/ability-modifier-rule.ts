import type { ImportedNumber } from "../../shape/imported-number";
import { ABILITY_MODIFIER } from "../../shape/import-limits";
import { numberInRange } from "../../shape/number-in-range";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { modifierOf } from "./modifier-of";

export class AbilityModifierRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: `${this.ability.short} modifier`, value: this.modifier(character, earlier) }];
  }

  private modifier(character: RuleCharacter, earlier: EarlierNumbers) {
    const missing = unknownAmong([this.ability.short], earlier, character.route);
    if (missing !== null) return missing;
    const score = earlier.valueOf(this.ability.short, character.route).valueOr(0);
    const working = `floor((${score} - 10) / 2) = ${modifierOf(score)}`;
    return numberInRange(modifierOf(score), ABILITY_MODIFIER, working, character.route);
  }
}
