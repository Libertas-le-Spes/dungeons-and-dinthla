import type { RuleCharacter } from "../../input/rule-character";
import { ConditionalSubTypes } from "../../modifiers/handlers/conditional-sub-types";
import type { ModifierTally } from "../../modifiers/modifier-tally";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { tallyFor } from "../../modifiers/tally-for";
import { MonkDefenceModifier } from "./monk-defence-modifier";

const FAMILY = new SubTypeFamily([], ["armor-class"]);
const DUAL_WIELD = new ConditionalSubTypes(["dual-wield-armor-class"]);

export function armourModifiersOf(character: RuleCharacter): ModifierTally {
  return tallyFor(character, FAMILY, ["armor-class"], [DUAL_WIELD, new MonkDefenceModifier(character)]);
}
