import type { ImportedNumber } from "../../../shape/imported-number";
import { firstFound } from "../../core/first-found";
import type { RuleCharacter } from "../../input/rule-character";
import type { CastingClass } from "../casters/casting-class";
import { slotNumbersFrom, slotsNotKnown } from "./slot-numbers";

export function singleSlots(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  const only = firstFound(standard);
  if (only === undefined) return [];
  const slots = only.caster.kind.table.slotsAt(only.ruleClass.level);
  if (slots === undefined) return slotsNotKnown(`${only.caster.label} has a level the slot table does not hold.`, character);
  return slotNumbersFrom(slots, `${only.caster.label} ${only.ruleClass.level}, ${only.caster.kind.label}`, character);
}
