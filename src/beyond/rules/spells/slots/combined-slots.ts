import type { ImportedNumber } from "../../../shape/imported-number";
import type { RuleCharacter } from "../../input/rule-character";
import type { CastingClass } from "../casters/casting-class";
import { slotNumbersFrom, slotsNotKnown } from "./slot-numbers";
import { FULL_SLOTS } from "./tables/full-slots";

function casterLevelOf(casting: CastingClass): number {
  return casting.caster.kind.casterLevelOf(casting.ruleClass.level);
}

function addedCasterLevel(total: number, casting: CastingClass): number {
  return total + casterLevelOf(casting);
}

function levelTerm(casting: CastingClass): string {
  return `${casting.caster.label} ${casting.ruleClass.level} gives ${casterLevelOf(casting)}`;
}

export function combinedSlots(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  const level = standard.reduce(addedCasterLevel, 0);
  const slots = FULL_SLOTS.slotsAt(level);
  if (slots === undefined) return slotsNotKnown(`The combined caster level ${level} is not in the multiclass table.`, character);
  return slotNumbersFrom(slots, `multiclass: ${standard.map(levelTerm).join(", ")}, caster level ${level}`, character);
}
