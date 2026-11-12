import type { ImportedNumber } from "../../../shape/imported-number";
import { SAVING_THROW } from "../../../shape/import-limits";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import type { Ability } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { proficientCheck } from "../proficient-check";

export class SavingThrowRule implements Rule {
  constructor(private readonly ability: Ability) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const own = `${this.ability.subTypeName}-saving-throws`;
    const value = proficientCheck(character, earlier, {
      abilityShort: this.ability.short,
      claim: { subType: own, halfApplies: false },
      family: new SubTypeFamily([own, "saving-throws"], []),
      plainSubTypes: [own, "saving-throws"],
      range: SAVING_THROW,
    });
    return [{ name: `${this.ability.short} save`, value }];
  }
}
