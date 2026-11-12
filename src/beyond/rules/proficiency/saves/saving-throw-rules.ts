import type { Rule } from "../../core/rule";
import { ABILITIES } from "../../input/ability";
import type { Ability } from "../../input/ability";
import { SavingThrowRule } from "./saving-throw-rule";

function ruleOf(ability: Ability): Rule {
  return new SavingThrowRule(ability);
}

export const SAVING_THROW_RULES: readonly Rule[] = ABILITIES.map(ruleOf);
