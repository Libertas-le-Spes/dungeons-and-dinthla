import type { ImportedNumber } from "../../shape/imported-number";
import { MAX_HIT_POINTS } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { MAX_HIT_POINTS_NAME, TOTAL_LEVEL_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { knownIn, notKnown } from "../core/worked";
import { sumWorking } from "../core/working-text";
import { CONSTITUTION } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { minimumProblemOf } from "./minimum-per-level";
import { addedAmount, addedSourceNames, explanationOf, firstNotKnown, perLevelAdditions } from "./per-level-additions";
import { unfamiliarPerLevelModifier } from "./per-level-modifiers";

function bonusTerms(bonus: number): readonly string[] {
  if (bonus === 0) return [];
  return [`bonus ${bonus}`];
}

export class MaxHitPointsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: MAX_HIT_POINTS_NAME, value: this.maximum(character, earlier) }];
  }

  private maximum(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    if (character.overrideHitPoints !== null) {
      return knownIn(character.overrideHitPoints, MAX_HIT_POINTS, "Set by hand", character.route);
    }
    const needed = NeededNumbers.of([TOTAL_LEVEL_NAME, CONSTITUTION.modifierName], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    return this.fromDice(character, needed);
  }

  private fromDice(character: RuleCharacter, needed: NeededNumbers): WorkedValue<number> {
    const base = character.baseHitPoints;
    const bonus = character.bonusHitPoints;
    if (base === null) return this.missingDice(character);
    if (bonus === null) return this.missingDice(character);
    return this.withAdditions(character, base, bonus, needed.numberOf(CONSTITUTION.modifierName), needed.numberOf(TOTAL_LEVEL_NAME));
  }

  private missingDice(character: RuleCharacter): WorkedValue<number> {
    return notKnown("The dice total or the bonus hit points are missing.", character.route);
  }

  private withAdditions(character: RuleCharacter, base: number, bonus: number, constitution: number, level: number): WorkedValue<number> {
    const unfamiliar = unfamiliarPerLevelModifier(character, addedSourceNames(character, level));
    if (unfamiliar !== null) return unfamiliar;
    const additions = perLevelAdditions(character, level);
    const unknownAddition = firstNotKnown(additions);
    if (unknownAddition !== undefined) return notKnown(unknownAddition.explanation, character.route);
    const problem = minimumProblemOf(character, base, constitution, level);
    if (problem !== null) return notKnown(problem, character.route);
    const total = base + constitution * level + bonus + additions.reduce(addedAmount, 0);
    const terms = [`${base}`, `CON ${constitution} x ${level}`, ...bonusTerms(bonus), ...additions.map(explanationOf)];
    return knownIn(total, MAX_HIT_POINTS, sumWorking(terms, total), character.route);
  }
}
