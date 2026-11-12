import type { ImportedNumber } from "../../../shape/imported-number";
import { SAVING_THROW } from "../../../shape/import-limits";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import { SAVING_THROW_TOUCHING } from "../../core/touching-lists";
import type { Ability } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { proficientCheck } from "../proficient-check";

export class SavingThrowRule implements Rule {
  private readonly own: string;
  private readonly family: SubTypeFamily;

  constructor(private readonly ability: Ability) {
    this.own = `${ability.subTypeName}-saving-throws`;
    this.family = new SubTypeFamily([this.own, "saving-throws"], []);
  }

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const touching = SAVING_THROW_TOUCHING.unknownFor(character);
    if (touching !== null) return [{ name: this.ability.saveName, value: touching }];
    const value = proficientCheck(character, earlier, {
      ability: this.ability,
      claim: { subType: this.own, halfApplies: false },
      family: this.family,
      plainSubTypes: [this.own, "saving-throws"],
      range: SAVING_THROW,
    });
    return [{ name: this.ability.saveName, value }];
  }
}
