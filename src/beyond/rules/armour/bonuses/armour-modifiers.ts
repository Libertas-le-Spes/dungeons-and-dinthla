import type { RuleCharacter } from "../../input/rule-character";
import { ConditionalSubTypes } from "../../modifiers/handlers/conditional-sub-types";
import type { ModifierTally } from "../../modifiers/modifier-tally";
import { standardHandlers } from "../../modifiers/standard-handlers";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { tallyModifiers } from "../../modifiers/tally-modifiers";
import { CONDITIONAL_ARMOUR_FEATURES } from "../conditional-armour-features";

const FAMILY = new SubTypeFamily([], ["armor-class"]);
const HANDLERS = standardHandlers(["armor-class"], [new ConditionalSubTypes(["dual-wield-armor-class"])]);

export function armourModifiersOf(character: RuleCharacter): ModifierTally {
  const tally = tallyModifiers(character.modifiers, FAMILY, HANDLERS);
  for (const feature of CONDITIONAL_ARMOUR_FEATURES) {
    if (character.features.includes(feature)) tally.noteConditional(feature);
  }
  return tally;
}
