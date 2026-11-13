import type { ImportedNumber } from "../../../shape/imported-number";
import type { RuleCharacter } from "../../input/rule-character";
import type { CastingClass } from "../casters/casting-class";
import { slotNumbersFrom, slotsNotKnown } from "./slot-numbers";

function slotsOfOne(character: RuleCharacter, casting: CastingClass): readonly ImportedNumber[] {
  const slots = casting.caster.kind.table.slotsAt(casting.ruleClass.level);
  if (slots === undefined) return slotsNotKnown(`${casting.caster.label} has a level the slot table does not hold.`, character);
  return slotNumbersFrom(slots, `${casting.caster.label} ${casting.ruleClass.level}, ${casting.caster.kind.label}`, character);
}

export function singleSlots(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  const found: ImportedNumber[] = [];
  for (const casting of standard) found.push(...slotsOfOne(character, casting));
  return found;
}
