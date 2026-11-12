import type { NotKnownValue } from "../../shape/not-known-value";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredSources } from "../modifiers/handlers/ignored-sources";
import { NotApplyingNow } from "../modifiers/handlers/not-applying-now";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { PER_LEVEL_SOURCES } from "./per-level-sources";

const FAMILY = new SubTypeFamily(["hit-points-per-level"], []);

function sourceName(source: { readonly sourceName: string }): string {
  return source.sourceName;
}

export function unfamiliarPerLevelModifier(character: RuleCharacter): NotKnownValue<number> | null {
  const handlers = [new NotApplyingNow(), new IgnoredSources(PER_LEVEL_SOURCES.map(sourceName))];
  return unknownModifiers(tallyModifiers(character.modifiers, FAMILY, handlers), character.route);
}
