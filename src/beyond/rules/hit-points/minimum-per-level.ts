import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

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

export function minimumMayApply(character: RuleCharacter, base: number, constitution: number, level: number): boolean {
  if (constitution >= 0) return false;
  const worstLevel = lowestPossibleLevel(character, base, level) + constitution;
  return worstLevel < 1;
}
