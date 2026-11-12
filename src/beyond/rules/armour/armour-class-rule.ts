import type { ImportedNumber } from "../../shape/imported-number";
import { ARMOUR_CLASS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { reasonedWorking, withConditional } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleItem } from "../input/rule-item";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import type { ArmourCandidate } from "./armour-candidate";
import { armourModifiersOf } from "./armour-modifiers";
import { ARMOUR_BONUSES } from "./armour-bonuses";
import { bestOf, candidatesFor, firstUnknown } from "./armour-choice";
import { wornArmourOf } from "./worn-armour";
import type { WornArmour } from "./worn-armour";

function names(items: readonly RuleItem[]): string {
  return items.map((item) => item.name).join(", ");
}

function conflictIn(worn: WornArmour, character: RuleCharacter): NotKnownValue<number> | null {
  if (worn.body.length > 1) return new NotKnownValue(`More than one body armour is worn: ${names(worn.body)}. Settle it on D&D Beyond.`, character.route);
  if (worn.shields.length > 1) return new NotKnownValue(`More than one shield is held: ${names(worn.shields)}. Settle it on D&D Beyond.`, character.route);
  return null;
}

function shieldTerms(worn: WornArmour): readonly string[] {
  return worn.shields.map((shield) => `${shield.name} ${shield.armourClass}`);
}

function shieldAmount(worn: WornArmour): number {
  return worn.shields.reduce((total, shield) => total + shield.armourClass, 0);
}

export class ArmourClassRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "AC", value: this.armourClass(character, earlier) }];
  }

  private armourClass(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const worn = wornArmourOf(character);
    const conflict = conflictIn(worn, character);
    if (conflict !== null) return conflict;
    const candidates = candidatesFor(character, worn, earlier);
    const unknown = firstUnknown(candidates);
    if (unknown !== undefined) return new NotKnownValue(unknown.reason, character.route);
    const best = bestOf(candidates);
    if (best === undefined) return new NotKnownValue("No way of working out armor class applies.", character.route);
    return this.withBonuses(character, worn, best);
  }

  private withBonuses(character: RuleCharacter, worn: WornArmour, best: ArmourCandidate): WorkedValue<number> {
    const tally = armourModifiersOf(character);
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const bonuses = ARMOUR_BONUSES.filter((bonus) => bonus.appliesTo(character, worn));
    const total = best.total + shieldAmount(worn) + tally.added + bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    const terms = [...best.terms, ...shieldTerms(worn), ...bonuses.map((bonus) => bonus.term), ...tally.applied];
    const working = withConditional(reasonedWorking(terms, total, best.reason), tally.conditional);
    return numberInRange(total, ARMOUR_CLASS, working, character.route);
  }
}
