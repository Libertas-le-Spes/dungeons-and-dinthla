import type { ImportedNumber } from "../../shape/imported-number";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";
import { KnownValue } from "../../shape/known-value";

const DICE_SIDES = [4, 6, 8, 10, 12];

function isHitDie(ruleClass: RuleClass): boolean {
  return DICE_SIDES.includes(ruleClass.hitDie);
}

function diceTerm(ruleClass: RuleClass): string {
  return `${ruleClass.name} ${ruleClass.level}d${ruleClass.hitDie}`;
}

export class HitDiceRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Hit dice", value: this.dice(character, earlier) }];
  }

  private dice(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const missing = unknownAmong(["Total level"], earlier, character.route);
    if (missing !== null) return missing;
    if (!character.classes.every(isHitDie)) return new NotKnownValue("A hit die has to be a d4, d6, d8, d10 or d12.", character.route);
    const total = earlier.valueOf("Total level", character.route).valueOr(0);
    return KnownValue.wholeNumber(total, character.classes.map(diceTerm).join(" + "), character.route);
  }
}
