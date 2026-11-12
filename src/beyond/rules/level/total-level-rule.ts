import type { ImportedNumber } from "../../shape/imported-number";
import { CLASS_LEVEL, TOTAL_LEVEL } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { Rule } from "../core/rule";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";
import { isPlainWholeNumber } from "../../shape/whole-number";

function isLevel(ruleClass: RuleClass): boolean {
  if (!isPlainWholeNumber(ruleClass.level)) return false;
  if (ruleClass.level < CLASS_LEVEL.lowest) return false;
  return ruleClass.level <= CLASS_LEVEL.highest;
}

function levelTerm(ruleClass: RuleClass): string {
  return `${ruleClass.name} ${ruleClass.level}`;
}

function addedLevel(total: number, ruleClass: RuleClass): number {
  return total + ruleClass.level;
}

export class TotalLevelRule implements Rule {
  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: "Total level", value: this.total(character) }];
  }

  private total(character: RuleCharacter): WorkedValue<number> {
    if (character.classes.length === 0) return new NotKnownValue("The character has no class.", character.route);
    if (!character.classes.every(isLevel)) return new NotKnownValue(`${CLASS_LEVEL.what} has to be a whole number from ${CLASS_LEVEL.lowest} to ${CLASS_LEVEL.highest}.`, character.route);
    const total = character.classes.reduce(addedLevel, 0);
    return numberInRange(total, TOTAL_LEVEL, `${character.classes.map(levelTerm).join(" + ")} = ${total}`, character.route);
  }
}
