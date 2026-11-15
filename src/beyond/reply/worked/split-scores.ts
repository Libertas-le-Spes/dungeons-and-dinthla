import type { AbilityScores } from "../../shape/ability-scores";
import type { ImportedNumber } from "../../shape/imported-number";
import { EarlierNumbers } from "../../rules/core/earlier-numbers";
import { CHARISMA, CONSTITUTION, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../rules/input/ability";
import { ABILITY_IDS } from "../rule-input/scores/ability-ids";
import { ONLINE } from "../common/online-route";

export function scoresIn(numbers: readonly ImportedNumber[]): AbilityScores {
  const found = EarlierNumbers.none().withAll(numbers);
  return {
    strength: found.valueOf(STRENGTH.short, ONLINE),
    dexterity: found.valueOf(DEXTERITY.short, ONLINE),
    constitution: found.valueOf(CONSTITUTION.short, ONLINE),
    intelligence: found.valueOf(INTELLIGENCE.short, ONLINE),
    wisdom: found.valueOf(WISDOM.short, ONLINE),
    charisma: found.valueOf(CHARISMA.short, ONLINE),
  };
}

function isNotScore(number: ImportedNumber): boolean {
  return !ABILITY_IDS.some((entry) => entry.ability.short === number.name);
}

export function numbersWithoutScores(numbers: readonly ImportedNumber[]): readonly ImportedNumber[] {
  return numbers.filter(isNotScore);
}
