import type { NotKnownValue } from "../../shape/not-known-value";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredSources } from "../modifiers/handlers/ignored-sources";
import { NotInForce } from "../modifiers/handlers/not-in-force";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";

const FAMILY = new SubTypeFamily(["hit-points-per-level"], ["hit-points"]);

export function unfamiliarPerLevelModifier(character: RuleCharacter, addedSources: readonly string[]): NotKnownValue<number> | null {
  const handlers = [new NotInForce(), new IgnoredSources(addedSources)];
  return unknownModifiers(tallyModifiers(character.modifiers, FAMILY, handlers), character.route);
}
