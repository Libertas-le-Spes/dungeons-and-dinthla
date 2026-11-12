import type { ImportedNumber } from "../../shape/imported-number";
import { HIT_POINTS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import { sumWorking } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import { addedAmount, explanationOf, firstNotKnown, perLevelAdditions } from "./per-level-additions";
import { unfamiliarPerLevelModifier } from "./per-level-modifiers";

function bonusTerms(bonus: number): readonly string[] {
  if (bonus === 0) return [];
  return [`bonus ${bonus}`];
}

export class MaxHitPointsRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "HP", value: this.maximum(character, earlier) }];
  }

  private maximum(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    if (character.overrideHitPoints !== null) {
      return numberInRange(character.overrideHitPoints, HIT_POINTS, `Hit points set on D&D Beyond: ${character.overrideHitPoints}`, character.route);
    }
    const missing = unknownAmong(["Total level", "CON modifier"], earlier, character.route);
    if (missing !== null) return missing;
    return this.fromDice(character, earlier);
  }

  private fromDice(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const base = character.baseHitPoints;
    const bonus = character.bonusHitPoints;
    if (base === null) return this.missingDice(character);
    if (bonus === null) return this.missingDice(character);
    const level = earlier.valueOf("Total level", character.route).valueOr(0);
    const constitution = earlier.valueOf("CON modifier", character.route).valueOr(0);
    return this.withAdditions(character, base, bonus, constitution, level);
  }

  private missingDice(character: RuleCharacter): WorkedValue<number> {
    return new NotKnownValue("The dice total or the bonus hit points are missing.", character.route);
  }

  private withAdditions(character: RuleCharacter, base: number, bonus: number, constitution: number, level: number): WorkedValue<number> {
    const unfamiliar = unfamiliarPerLevelModifier(character);
    if (unfamiliar !== null) return unfamiliar;
    const additions = perLevelAdditions(character, level);
    const unknownAddition = firstNotKnown(additions);
    if (unknownAddition !== undefined) return new NotKnownValue(unknownAddition.explanation, character.route);
    if (base + constitution * level < level) return new NotKnownValue("With this constitution the dice total may fall under 1 hit point a level, and the dice total is only a sum, so I can't tell.", character.route);
    const total = base + constitution * level + bonus + additions.reduce(addedAmount, 0);
    const terms = [`${base}`, `CON ${constitution} x ${level}`, ...bonusTerms(bonus), ...additions.map(explanationOf)];
    return numberInRange(total, HIT_POINTS, sumWorking(terms, total), character.route);
  }
}
