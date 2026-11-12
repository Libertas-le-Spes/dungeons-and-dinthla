import { ABILITY_MODIFIER_RULES, ABILITY_SCORE_RULES } from "./abilities/ability-rules";
import { ArmourClassRule } from "./armour/armour-class-rule";
import { CarryingCapacityRule } from "./carrying/carrying-capacity-rule";
import type { Rule } from "./core/rule";
import { CurrentHitPointsRule } from "./hit-points/current-hit-points-rule";
import { MaxHitPointsRule } from "./hit-points/max-hit-points-rule";
import { TemporaryHitPointsRule } from "./hit-points/temporary-hit-points-rule";
import { InitiativeRule } from "./initiative/initiative-rule";
import { HitDiceRule } from "./level/hit-dice-rule";
import { ProficiencyBonusRule } from "./level/proficiency-bonus-rule";
import { TotalLevelRule } from "./level/total-level-rule";
import { PASSIVE_RULES } from "./passive/passive-rules";
import { SAVING_THROW_RULES } from "./proficiency/saves/saving-throw-rules";
import { SKILL_RULES } from "./proficiency/skills/skill-rules";
import { SpeedRule } from "./speed/speed-rule";
import { SPELL_RULES } from "./spells/spell-rules";

export const RULE_LIST: readonly Rule[] = [
  new TotalLevelRule(),
  new ProficiencyBonusRule(),
  ...ABILITY_SCORE_RULES,
  ...ABILITY_MODIFIER_RULES,
  new HitDiceRule(),
  new MaxHitPointsRule(),
  new CurrentHitPointsRule(),
  new TemporaryHitPointsRule(),
  new ArmourClassRule(),
  new InitiativeRule(),
  new SpeedRule(),
  ...SAVING_THROW_RULES,
  ...SKILL_RULES,
  ...PASSIVE_RULES,
  ...SPELL_RULES,
  new CarryingCapacityRule(),
];
