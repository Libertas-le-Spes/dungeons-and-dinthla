import { ABILITIES } from "../../../src/beyond/rules/input/ability";
import { AbilityTable } from "../../../src/beyond/rules/input/by-ability";
import type { RuleCharacter } from "../../../src/beyond/rules/input/rule-character";
import { madeUpRuleCharacter, scoresOf } from "./made-up-rule-character";
import { numberNamed } from "./rule-numbers";

export function armourClassOf(changes: Partial<RuleCharacter>): { value: number; working: string } {
  const value = numberNamed(madeUpRuleCharacter(changes), "AC");
  return { value: value.valueOr(-1), working: value.explanation };
}

export function withDexterity(score: number): AbilityTable<number> {
  return scoresOf(10, score, 10, 10, 10, 10);
}

export function onlyAbilityRaised(raised: string): AbilityTable<number> {
  const scores = new AbilityTable<number>();
  for (const ability of ABILITIES) {
    if (ability.short === raised) scores.with(ability, 14);
    else scores.with(ability, 10);
  }
  return scores;
}
