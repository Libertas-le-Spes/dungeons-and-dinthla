import type { ImportedNumber } from "../../shape/imported-number";
import { SPELL_ATTACK, SPELL_SAVE_DC } from "../../shape/import-limits";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { reasonedWorking } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import type { CasterClass } from "./caster-class";
import { castingClassesOf } from "./casting-class";
import { castingInputsOf } from "./casting-inputs";

export class SpellcastingRule implements Rule {
  constructor(private readonly caster: CasterClass) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const casts = castingClassesOf(character).some((casting) => casting.caster === this.caster);
    if (!casts) return [];
    return [
      { name: `${this.caster.label} spell save DC`, value: this.saveDc(character, earlier) },
      { name: `${this.caster.label} spell attack bonus`, value: this.attack(character, earlier) },
    ];
  }

  private reason(): string {
    return `${this.caster.label}, casting with ${this.caster.ability.label}`;
  }

  private saveDc(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const inputs = castingInputsOf(this.caster, character, earlier);
    if (inputs.missing !== null) return inputs.missing;
    const total = 8 + inputs.bonus + inputs.modifier;
    return numberInRange(total, SPELL_SAVE_DC, reasonedWorking(["8", ...inputs.terms], total, this.reason()), character.route);
  }

  private attack(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const inputs = castingInputsOf(this.caster, character, earlier);
    if (inputs.missing !== null) return inputs.missing;
    const total = inputs.bonus + inputs.modifier;
    return numberInRange(total, SPELL_ATTACK, reasonedWorking(inputs.terms, total, this.reason()), character.route);
  }
}
