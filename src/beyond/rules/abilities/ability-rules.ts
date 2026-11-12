import { ABILITIES } from "../input/ability";
import type { Rule } from "../core/rule";
import { AbilityModifierRule } from "./ability-modifier-rule";
import { AbilityScoreRule } from "./ability-score-rule";

export const ABILITY_SCORE_RULES: readonly Rule[] = ABILITIES.map((ability) => new AbilityScoreRule(ability));
export const ABILITY_MODIFIER_RULES: readonly Rule[] = ABILITIES.map((ability) => new AbilityModifierRule(ability));
