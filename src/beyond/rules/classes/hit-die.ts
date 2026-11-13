import type { RuleClass } from "../input/rule-class";

const DICE_SIDES = [4, 6, 8, 10, 12];

export function isHitDie(ruleClass: RuleClass): boolean {
  return DICE_SIDES.includes(ruleClass.hitDie);
}
