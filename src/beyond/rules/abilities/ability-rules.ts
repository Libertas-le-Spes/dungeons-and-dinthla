import type { Rule } from "../core/rule";
import { ABILITIES } from "../input/ability";
import type { Ability } from "../input/ability";
import { AbilityModifierRule } from "./ability-modifier-rule";
import { AbilityScoreRule } from "./ability-score-rule";

function scoreRuleOf(ability: Ability): Rule {
  return new AbilityScoreRule(ability);
}

function modifierRuleOf(ability: Ability): Rule {
  return new AbilityModifierRule(ability);
}

export const ABILITY_SCORE_RULES: readonly Rule[] = ABILITIES.map(scoreRuleOf);
export const ABILITY_MODIFIER_RULES: readonly Rule[] = ABILITIES.map(modifierRuleOf);
