import type { ImportedNumber } from "../../shape/imported-number";
import { SPELL_ATTACK, SPELL_SAVE_DC } from "../../shape/import-limits";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import { reasonedWorking } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import type { CasterClass } from "./caster-class";
import { castingClassesOf } from "./casting-class";

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
    const modifierName = `${this.caster.ability.short} modifier`;
    const missing = unknownAmong([modifierName, "Proficiency bonus"], earlier, character.route);
    if (missing !== null) return missing;
    const bonus = earlier.valueOf("Proficiency bonus", character.route).valueOr(0);
    const modifier = earlier.valueOf(modifierName, character.route).valueOr(0);
    const terms = ["8", `proficiency ${bonus}`, `${this.caster.ability.short} ${modifier}`];
    return numberInRange(8 + bonus + modifier, SPELL_SAVE_DC, reasonedWorking(terms, 8 + bonus + modifier, this.reason()), character.route);
  }

  private attack(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const modifierName = `${this.caster.ability.short} modifier`;
    const missing = unknownAmong([modifierName, "Proficiency bonus"], earlier, character.route);
    if (missing !== null) return missing;
    const bonus = earlier.valueOf("Proficiency bonus", character.route).valueOr(0);
    const modifier = earlier.valueOf(modifierName, character.route).valueOr(0);
    const terms = [`proficiency ${bonus}`, `${this.caster.ability.short} ${modifier}`];
    return numberInRange(bonus + modifier, SPELL_ATTACK, reasonedWorking(terms, bonus + modifier, this.reason()), character.route);
  }
}
