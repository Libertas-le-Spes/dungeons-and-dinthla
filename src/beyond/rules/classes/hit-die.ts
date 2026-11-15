import type { RuleClass } from "../input/rule-class";

export const HIT_DIE_REASON = "Hit die must be d4-d12.";

const DICE_SIDES = [4, 6, 8, 10, 12];

export function isHitDie(ruleClass: RuleClass): boolean {
  return DICE_SIDES.includes(ruleClass.hitDie);
}
