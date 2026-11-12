import type { RuleCharacter } from "../input/rule-character";
import type { ModifierHandler } from "./modifier-handler";
import type { ModifierTally } from "./modifier-tally";
import { standardHandlers } from "./standard-handlers";
import type { SubTypeFamily } from "./sub-type-family";
import { tallyModifiers } from "./tally-modifiers";

export function tallyFor(character: RuleCharacter, family: SubTypeFamily, plainSubTypes: readonly string[], extra: readonly ModifierHandler[] = []): ModifierTally {
  return tallyModifiers(character.modifiers, family, standardHandlers(plainSubTypes, extra));
}
