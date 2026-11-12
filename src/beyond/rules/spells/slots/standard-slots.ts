import type { ImportedNumber } from "../../../shape/imported-number";
import { isTwentyFourteen } from "../../input/edition";
import type { RuleCharacter } from "../../input/rule-character";
import type { CastingClass } from "../casters/casting-class";
import { combinedSlots } from "./combined-slots";
import { singleSlots } from "./single-slots";
import { slotsNotKnown } from "./slot-numbers";

const EDITION_REASON = "The slot tables of half and third casters differ between the 2014 and 2024 rules, and the edition is not 2014.";

function editionDiffers(standard: readonly CastingClass[]): boolean {
  return standard.some((casting) => casting.caster.kind.differsByEdition);
}

export function standardSlotsOf(character: RuleCharacter, standard: readonly CastingClass[]): readonly ImportedNumber[] {
  if (standard.length === 0) return [];
  if (editionDiffers(standard) && !isTwentyFourteen(character.edition)) return slotsNotKnown(EDITION_REASON, character);
  if (standard.length > 1) return combinedSlots(character, standard);
  return singleSlots(character, standard);
}
