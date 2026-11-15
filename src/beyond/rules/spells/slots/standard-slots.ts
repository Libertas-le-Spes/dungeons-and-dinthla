import type { ImportedNumber } from "../../../shape/imported-number";
import type { RuleCharacter } from "../../input/rule-character";
import { EDITION_NOT_2014 } from "../../input/edition";
import type { CastingClass } from "../casters/casting-class";
import { combinedSlots } from "./combined-slots";
import { singleSlots } from "./single-slots";
import { slotsNotKnown } from "./slot-numbers";


function isEditionKnownFor(character: RuleCharacter): (casting: CastingClass) => boolean {
  return function isKnown(casting: CastingClass): boolean {
    return casting.caster.kind.editionKnows(character.edition);
  };
}

export function standardSlotsOf(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  if (standard.length === 0) return [];
  if (!standard.every(isEditionKnownFor(character))) return slotsNotKnown(EDITION_NOT_2014, character);
  if (standard.length > 1) return combinedSlots(character, standard);
  return singleSlots(character, standard);
}
