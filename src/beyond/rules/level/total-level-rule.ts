import { wholeNumberReason } from "../../shape/number-in-range";
import type { ImportedNumber } from "../../shape/imported-number";
import { CHARACTER_LEVEL, CLASS_LEVEL } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import { isPlainWholeNumber } from "../../shape/whole-number";
import type { Rule } from "../core/rule";
import { normal } from "../core/same-name";
import { TOTAL_LEVEL_NAME } from "../core/number-names";
import { knownIn, notKnown } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";

function isLevel(ruleClass: RuleClass): boolean {
  if (!isPlainWholeNumber(ruleClass.level)) return false;
  if (ruleClass.level < CLASS_LEVEL.lowest) return false;
  return ruleClass.level <= CLASS_LEVEL.highest;
}

function levelTerm(ruleClass: RuleClass): string {
  return `${ruleClass.name.text} ${ruleClass.level}`;
}

function addedLevel(total: number, ruleClass: RuleClass): number {
  return total + ruleClass.level;
}

function namesOf(classes: readonly RuleClass[]): string[] {
  return classes.map(nameOf);
}

function nameOf(ruleClass: RuleClass): string {
  return ruleClass.name.text;
}

function firstRepeated(classes: readonly RuleClass[]): string | undefined {
  const seen = new Set<string>();
  for (const name of namesOf(classes)) {
    if (seen.has(normal(name))) return name;
    seen.add(normal(name));
  }
  return undefined;
}

export class TotalLevelRule implements Rule {
  workOut(character: RuleCharacter): readonly ImportedNumber[] {
    return [{ name: TOTAL_LEVEL_NAME, value: this.total(character) }];
  }

  private total(character: RuleCharacter): WorkedValue<number> {
    if (character.classes.length === 0) return notKnown("The character has no class.", character.route);
    const repeated = firstRepeated(character.classes);
    if (repeated !== undefined) return notKnown(`The class ${repeated} is listed more than once.`, character.route);
    if (!character.classes.every(isLevel)) return notKnown(wholeNumberReason(CLASS_LEVEL), character.route);
    const total = character.classes.reduce(addedLevel, 0);
    return knownIn(total, CHARACTER_LEVEL, `${character.classes.map(levelTerm).join(" + ")} = ${total}`, character.route);
  }
}
