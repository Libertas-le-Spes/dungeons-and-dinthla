import type { ImportedNumber } from "../../../shape/imported-number";
import type { RuleCharacter } from "../../input/rule-character";
import type { CastingClass } from "../casters/casting-class";
import { combinedSlots } from "./combined-slots";
import { singleSlots } from "./single-slots";
import { slotsNotKnown } from "./slot-numbers";

const EDITION_REASON = "The slot tables of half and third casters differ between the 2014 and 2024 rules, and the edition is not 2014.";

function isEditionKnownFor(character: RuleCharacter): (casting: CastingClass) => boolean {
  return function isKnown(casting: CastingClass): boolean {
    return casting.caster.kind.editionKnows(character.edition);
  };
}

export function standardSlotsOf(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  if (standard.length === 0) return [];
  if (!standard.every(isEditionKnownFor(character))) return slotsNotKnown(EDITION_REASON, character);
  if (standard.length > 1) return combinedSlots(character, standard);
  return singleSlots(character, standard);
}
