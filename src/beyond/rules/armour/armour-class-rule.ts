import type { ImportedNumber } from "../../shape/imported-number";
import { ARMOUR_CLASS } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { ARMOUR_CLASS_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { ARMOUR_CLASS_TOUCHING } from "../core/touching-lists";
import { knownIn, notKnown } from "../core/worked";
import { reasonedWorking, withConditional } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleItem } from "../input/rule-item";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { conflictIn } from "./choice/armour-conflict";
import { ARMOUR_BONUSES } from "./bonuses/armour-bonuses";
import { armourModifiersOf } from "./bonuses/armour-modifiers";
import type { ArmourBonus } from "./bonuses/armour-bonus";
import type { ArmourCandidate } from "./choice/armour-candidate";
import { bestOf, candidatesFor, firstUnknown } from "./choice/armour-choice";
import { wornArmourOf } from "./choice/worn-armour";
import type { WornArmour } from "./choice/worn-armour";

function shieldTerm(shield: RuleItem): string {
  return `${shield.name.text} ${shield.armourClass}`;
}

function addedShield(total: number, shield: RuleItem): number {
  return total + shield.armourClass;
}

function addedBonus(total: number, bonus: ArmourBonus): number {
  return total + bonus.amount;
}

function termOf(bonus: ArmourBonus): string {
  return bonus.term;
}

function appliesFor(character: RuleCharacter, worn: WornArmour): (bonus: ArmourBonus) => boolean {
  return function applies(bonus: ArmourBonus): boolean {
    return bonus.appliesTo(character, worn);
  };
}

export class ArmourClassRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: ARMOUR_CLASS_NAME, value: this.armourClass(character, earlier) }];
  }

  private armourClass(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const touching = ARMOUR_CLASS_TOUCHING.unknownFor(character);
    if (touching !== null) return touching;
    const worn = wornArmourOf(character);
    const conflict = conflictIn(worn, character);
    if (conflict !== null) return conflict;
    const candidates = candidatesFor(character, worn, earlier);
    const unknown = firstUnknown(candidates);
    if (unknown !== undefined) return notKnown(unknown.reason, character.route);
    const best = bestOf(candidates);
    if (best === undefined) return notKnown("No way of working out armor class applies.", character.route);
    return this.withBonuses(character, worn, best);
  }

  private withBonuses(character: RuleCharacter, worn: WornArmour, best: ArmourCandidate): WorkedValue<number> {
    const tally = armourModifiersOf(character);
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const bonuses = ARMOUR_BONUSES.filter(appliesFor(character, worn));
    const total = best.total + worn.shields.reduce(addedShield, 0) + tally.added + bonuses.reduce(addedBonus, 0);
    const terms = [...best.terms, ...worn.shields.map(shieldTerm), ...bonuses.map(termOf), ...tally.applied];
    const working = withConditional(reasonedWorking(terms, total, best.reason), tally.conditional);
    return knownIn(total, ARMOUR_CLASS, working, character.route);
  }
}
