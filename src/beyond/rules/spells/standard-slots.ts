import type { ImportedNumber } from "../../shape/imported-number";
import { KnownValue } from "../../shape/known-value";
import { NotKnownValue } from "../../shape/not-known-value";
import { firstOf } from "../core/first-of";
import type { RuleCharacter } from "../input/rule-character";
import { FULL_SLOTS } from "./tables/full-slots";
import type { CastingClass } from "./casting-class";
import { isTwentyFourteen } from "../input/edition";

function casterLevelOf(casting: CastingClass): number {
  return casting.caster.kind.casterLevelOf(casting.ruleClass.level);
}

function addedCasterLevel(total: number, casting: CastingClass): number {
  return total + casterLevelOf(casting);
}

function levelTerm(casting: CastingClass): string {
  return `${casting.caster.label} ${casting.ruleClass.level} gives ${casterLevelOf(casting)}`;
}

function numbersFrom(slots: readonly number[], working: string, character: RuleCharacter): readonly ImportedNumber[] {
  const found: ImportedNumber[] = [];
  let spellLevel = 0;
  for (const count of slots) {
    spellLevel += 1;
    found.push({ name: `Spell slots level ${spellLevel}`, value: KnownValue.wholeNumber(count, working, character.route) });
  }
  return found;
}

function notKnown(reason: string, character: RuleCharacter): readonly ImportedNumber[] {
  return [{ name: "Spell slots", value: new NotKnownValue(reason, character.route) }];
}

function editionDiffers(standard: readonly CastingClass[]): boolean {
  return standard.some((casting) => casting.caster.kind.differsByEdition);
}

export function standardSlotsOf(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  if (standard.length === 0) return [];
  if (editionDiffers(standard) && !isTwentyFourteen(character.edition)) return notKnown("The slot tables of half and third casters differ between the 2014 and 2024 rules, and the edition is not 2014.", character);
  if (standard.length > 1) return combinedSlots(character, standard);
  return singleSlots(character, standard);
}

function singleSlots(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  const only = firstOf(standard);
  if (only === undefined) return [];
  const slots = only.caster.kind.table.slotsAt(only.ruleClass.level);
  if (slots === undefined) return notKnown(`${only.caster.label} has a level the slot table does not hold.`, character);
  return numbersFrom(slots, `${only.caster.label} ${only.ruleClass.level}, ${only.caster.kind.label}`, character);
}

function combinedSlots(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  const level = standard.reduce(addedCasterLevel, 0);
  const slots = FULL_SLOTS.slotsAt(level);
  if (slots === undefined) return notKnown(`The combined caster level ${level} is not in the multiclass table.`, character);
  return numbersFrom(slots, `multiclass: ${standard.map(levelTerm).join(", ")}, caster level ${level}`, character);
}
