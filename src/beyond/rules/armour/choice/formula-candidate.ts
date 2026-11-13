import type { EarlierNumbers } from "../../core/earlier-numbers";
import { NeededNumbers } from "../../core/needed-numbers";
import { DEXTERITY } from "../../input/ability";
import type { Ability } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import type { ArmourCandidate } from "./armour-candidate";
import { KnownCandidate, UnknownCandidate } from "./armour-candidate";
import type { Formula } from "./formula";

function modifierNameOf(ability: Ability): string {
  return ability.modifierName;
}

function amountOf(needed: NeededNumbers, ability: Ability): number {
  return needed.numberOf(ability.modifierName);
}

function amountFrom(needed: NeededNumbers): (ability: Ability) => number {
  return function amountOfAbility(ability: Ability): number {
    return amountOf(needed, ability);
  };
}

function termFrom(needed: NeededNumbers): (ability: Ability) => string {
  return function termOfAbility(ability: Ability): string {
    return `${ability.short} ${amountOf(needed, ability)}`;
  };
}

export function formulaCandidate(character: RuleCharacter, earlier: EarlierNumbers, formula: Formula): ArmourCandidate {
  const needed = NeededNumbers.of([DEXTERITY, ...formula.others].map(modifierNameOf), earlier, character.route);
  if (needed.missing !== null) return new UnknownCandidate(needed.missing.explanation);
  const dexterity = formula.dexterity.dexterityPart(amountOf(needed, DEXTERITY));
  const others = formula.others.map(amountFrom(needed));
  const total = formula.baseAmount + dexterity + others.reduce(addNumbers, 0);
  const terms = [formula.baseText, `DEX ${dexterity}`, ...formula.others.map(termFrom(needed))];
  return new KnownCandidate(total, terms, formula.reason);
}

function addNumbers(total: number, amount: number): number {
  return total + amount;
}
