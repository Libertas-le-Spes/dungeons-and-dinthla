import { HIT_DIE_REASON, isHitDie } from "../classes/hit-die";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

const MINIMUM_REASON = "Minimum hit points per level unclear.";

function largerDie(largest: number, ruleClass: RuleClass): number {
  return Math.max(largest, ruleClass.hitDie);
}

function largestDieOf(character: RuleCharacter): number {
  return character.classes.reduce(largerDie, 0);
}

function lowestPossibleLevel(character: RuleCharacter, base: number, level: number): number {
  const mostTheOtherLevelsCanHold = (level - 1) * largestDieOf(character);
  return base - mostTheOtherLevelsCanHold;
}

export function minimumProblemOf(character: RuleCharacter, base: number, constitution: number, level: number): string | null {
  if (constitution >= 0) return null;
  if (!character.classes.every(isHitDie)) return HIT_DIE_REASON;
  const worstLevel = lowestPossibleLevel(character, base, level) + constitution;
  if (worstLevel < 1) return MINIMUM_REASON;
  return null;
}
